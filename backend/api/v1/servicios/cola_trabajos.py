# backend/api/v1/servicios/cola_trabajos.py
"""
Cola de trabajos en segundo plano, dentro del mismo proceso del backend.

Para qué: tareas que pueden tardar (hoy, generar una exportación) no se
hacen dentro del request. El endpoint solo ENCOLA el trabajo y responde
al instante con un id; un único hilo trabajador los va ejecutando de a
uno, en orden de llegada, y el cliente consulta el estado con ese id.
Así, por más exportaciones que se pidan juntas, nunca hay más de una
corriendo a la vez compitiendo con el resto de la API.

Es genérica: no sabe nada de empresas ni de Excel. Un trabajo es cualquier
función sin argumentos; su valor de retorno queda guardado como resultado.

    cola = ColaTrabajos("exportaciones")
    trabajo = cola.encolar(lambda: generar_algo(...), solicitante=7)
    ...
    cola.obtener(trabajo.id).estado  # en_cola -> procesando -> listo / error

Limitaciones (a propósito, igual que las notificaciones por WebSocket):
- Todo vive en memoria del proceso: si el backend se reinicia se pierden
  los trabajos, y funciona con un solo worker de uvicorn. Con varios
  workers/instancias haría falta una cola externa (Redis + RQ/Celery).
- Los resultados se borran a los TTL_RESULTADO de haber terminado.
"""
import logging
import queue
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)

TTL_RESULTADO = timedelta(minutes=30)
MAXIMO_EN_ESPERA = 50


class EstadoTrabajo(str, Enum):
    EN_COLA = "en_cola"
    PROCESANDO = "procesando"
    LISTO = "listo"
    ERROR = "error"


class ColaLlena(Exception):
    """Hay demasiados trabajos esperando; no se acepta uno más."""


@dataclass
class Trabajo:
    id: str
    solicitante: int
    creado_en: datetime
    estado: EstadoTrabajo = EstadoTrabajo.EN_COLA
    terminado_en: Optional[datetime] = None
    resultado: Any = None
    error: Optional[str] = None
    # Datos libres que quiera guardar quien encola (ej: los filtros usados).
    datos: dict = field(default_factory=dict)


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


class ColaTrabajos:
    def __init__(self, nombre: str, ttl_resultado: timedelta = TTL_RESULTADO, maximo_en_espera: int = MAXIMO_EN_ESPERA):
        self._nombre = nombre
        self._ttl_resultado = ttl_resultado
        self._pendientes: "queue.Queue[tuple[str, Callable[[], Any]]]" = queue.Queue(maxsize=maximo_en_espera)
        self._trabajos: Dict[str, Trabajo] = {}
        self._lock = threading.Lock()
        self._hilo: Optional[threading.Thread] = None

    def encolar(self, tarea: Callable[[], Any], solicitante: int, datos: Optional[dict] = None) -> Trabajo:
        """Suma `tarea` al final de la cola y devuelve el trabajo (en estado en_cola)."""
        trabajo = Trabajo(id=uuid.uuid4().hex, solicitante=solicitante, creado_en=_ahora(), datos=datos or {})
        with self._lock:
            self._limpiar_vencidos()
            # Primero se registra y después se encola: el hilo trabajador
            # busca el trabajo por id apenas lo saca de la cola.
            self._trabajos[trabajo.id] = trabajo
            try:
                self._pendientes.put_nowait((trabajo.id, tarea))
            except queue.Full:
                del self._trabajos[trabajo.id]
                raise ColaLlena(f"La cola '{self._nombre}' está llena")
            self._asegurar_hilo()
        return trabajo

    def obtener(self, trabajo_id: str) -> Optional[Trabajo]:
        with self._lock:
            self._limpiar_vencidos()
            return self._trabajos.get(trabajo_id)

    def posicion(self, trabajo: Trabajo) -> int:
        """Cuántos trabajos tiene adelante esperando (0 si ya no está en cola)."""
        if trabajo.estado != EstadoTrabajo.EN_COLA:
            return 0
        with self._lock:
            return sum(
                1
                for otro in self._trabajos.values()
                if otro.estado == EstadoTrabajo.EN_COLA and otro.creado_en < trabajo.creado_en
            )

    def _asegurar_hilo(self) -> None:
        # El hilo se crea recién con el primer trabajo (igual que el pool de
        # Oracle en db_connector.py). daemon=True: no impide apagar el server.
        if self._hilo is None or not self._hilo.is_alive():
            self._hilo = threading.Thread(target=self._trabajar, name=f"cola-{self._nombre}", daemon=True)
            self._hilo.start()

    def _trabajar(self) -> None:
        while True:
            trabajo_id, tarea = self._pendientes.get()
            trabajo = self._trabajos.get(trabajo_id)
            if trabajo is None:
                continue
            trabajo.estado = EstadoTrabajo.PROCESANDO
            try:
                trabajo.resultado = tarea()
                trabajo.estado = EstadoTrabajo.LISTO
            except Exception:
                # El detalle va al log del server; al cliente solo un mensaje genérico.
                logger.exception("Falló el trabajo %s de la cola '%s'", trabajo_id, self._nombre)
                trabajo.error = "No se pudo completar el trabajo"
                trabajo.estado = EstadoTrabajo.ERROR
            finally:
                trabajo.terminado_en = _ahora()

    def _limpiar_vencidos(self) -> None:
        limite = _ahora() - self._ttl_resultado
        vencidos = [
            trabajo_id
            for trabajo_id, trabajo in self._trabajos.items()
            if trabajo.terminado_en is not None and trabajo.terminado_en < limite
        ]
        for trabajo_id in vencidos:
            del self._trabajos[trabajo_id]
