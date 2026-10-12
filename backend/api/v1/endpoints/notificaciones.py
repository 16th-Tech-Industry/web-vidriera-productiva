from datetime import datetime, timezone
from typing import Dict, List, Set

import jwt
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status

from api.v1.schemas.notificaciones import (
    NotificacionEnviadaResponse,
    NotificacionTodosRequest,
    NotificacionUsuariosRequest,
)
from security import JWT_ALGORITHM, JWT_SECRET_KEY, require_admin

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])

"""
Notificaciones en tiempo real (admin -> usuarios) — cómo funciona:

1. Cada dashboard, apenas carga, abre un WebSocket contra
   ws://<host>/api/v1/notificaciones/ws?token=<JWT>. El token va por query
   string porque el WebSocket del navegador no permite mandar el header
   Authorization. Si el token es inválido o venció, se rechaza la conexión.
2. El server guarda esa conexión en memoria, indexada por el id del usuario
   (el "sub" del JWT). Un mismo usuario puede tener varias pestañas abiertas,
   por eso cada id tiene un set de conexiones.
3. El admin envía por REST (no por el socket), así reutilizamos
   require_admin tal cual:
     - POST /notificaciones/todos     -> a todos los usuarios conectados
     - POST /notificaciones/usuarios  -> solo a los usuario_ids indicados
4. Cada dashboard recibe un JSON así:
     {"tipo": "notificacion", "alcance": "todos" | "usuarios",
      "titulo": "...", "mensaje": "...", "fecha": "<ISO 8601>"}

Limitaciones (a propósito, por ahora):
- Las notificaciones NO se guardan en la DB: el que no tiene el dashboard
  abierto en ese momento no la recibe. Si hace falta historial, se agrega
  una tabla `notificaciones` y se inserta ahí antes de enviar.
- Las conexiones viven en memoria del proceso: funciona con un solo worker
  de uvicorn. Con varios workers/instancias haría falta un pub/sub (Redis).
"""

ROL_ADMIN = 1


class GestorConexiones:
    """Registro en memoria de los WebSockets abiertos, por id de usuario."""

    def __init__(self) -> None:
        self._conexiones: Dict[int, Set[WebSocket]] = {}
        self._roles: Dict[int, int] = {}

    def conectar(self, usuario_id: int, rol: int, websocket: WebSocket) -> None:
        self._conexiones.setdefault(usuario_id, set()).add(websocket)
        self._roles[usuario_id] = rol

    def desconectar(self, usuario_id: int, websocket: WebSocket) -> None:
        sockets = self._conexiones.get(usuario_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            del self._conexiones[usuario_id]
            self._roles.pop(usuario_id, None)

    def usuarios_conectados(self) -> List[int]:
        return sorted(self._conexiones)

    async def enviar_a_usuario(self, usuario_id: int, datos: dict) -> bool:
        """Envía a todas las pestañas del usuario. Devuelve True si le llegó a alguna."""
        entregado = False
        for websocket in list(self._conexiones.get(usuario_id, ())):
            try:
                await websocket.send_json(datos)
                entregado = True
            except Exception:
                # Conexión muerta que todavía no se había detectado: la sacamos.
                self.desconectar(usuario_id, websocket)
        return entregado

    async def enviar_a_todos(self, datos: dict) -> int:
        """Envía a todos los usuarios conectados salvo administradores."""
        notificados = 0
        for usuario_id in list(self._conexiones):
            if self._roles.get(usuario_id) == ROL_ADMIN:
                continue
            if await self.enviar_a_usuario(usuario_id, datos):
                notificados += 1
        return notificados


gestor = GestorConexiones()


def _armar_mensaje(alcance: str, titulo: str, mensaje: str) -> dict:
    return {
        "tipo": "notificacion",
        "alcance": alcance,
        "titulo": titulo,
        "mensaje": mensaje,
        "fecha": datetime.now(timezone.utc).isoformat(),
    }


@router.websocket("/ws")
async def notificaciones_ws(websocket: WebSocket, token: str = ""):
    """Canal por el que cada dashboard recibe notificaciones en vivo.
    Requiere el JWT de login en el query param `token`."""
    try:
        usuario = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        usuario_id = int(usuario["sub"])
        rol = int(usuario.get("rol", 0))
    except (jwt.InvalidTokenError, KeyError, ValueError):
        # Cerrar antes de aceptar rechaza el handshake (el cliente ve un 403).
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    gestor.conectar(usuario_id, rol, websocket)
    try:
        # El cliente no necesita mandar nada; solo leemos para detectar
        # cuándo se desconecta (y aceptar pings de keep-alive si los manda).
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        gestor.desconectar(usuario_id, websocket)


@router.get("/conectados", response_model=List[int])
def listar_conectados(admin: dict = Depends(require_admin)):
    """Ids de los usuarios con el dashboard abierto ahora. Exclusivo de administradores."""
    return gestor.usuarios_conectados()


@router.post("/todos", response_model=NotificacionEnviadaResponse)
async def notificar_todos(payload: NotificacionTodosRequest, admin: dict = Depends(require_admin)):
    """Envía una notificación a todos los usuarios conectados. Exclusivo de administradores."""
    datos = _armar_mensaje("todos", payload.titulo, payload.mensaje)
    notificados = await gestor.enviar_a_todos(datos)
    return NotificacionEnviadaResponse(usuarios_notificados=notificados)


@router.post("/usuarios", response_model=NotificacionEnviadaResponse)
async def notificar_usuarios(payload: NotificacionUsuariosRequest, admin: dict = Depends(require_admin)):
    """Envía una notificación solo a los usuarios indicados (por id_representante).
    Exclusivo de administradores."""
    datos = _armar_mensaje("usuarios", payload.titulo, payload.mensaje)
    sin_conexion = []
    notificados = 0
    for usuario_id in dict.fromkeys(payload.usuario_ids):  # sin duplicados, mismo orden
        if await gestor.enviar_a_usuario(usuario_id, datos):
            notificados += 1
        else:
            sin_conexion.append(usuario_id)
    return NotificacionEnviadaResponse(usuarios_notificados=notificados, usuarios_sin_conexion=sin_conexion)
