"""
╔══════════════════════════════════════════════════════════════════════╗
║  TESTS DE ENDPOINTS — MÓDULO NOTICIAS                                ║
║  Archivo: backend/validaciones/test_endpoints_noticias.py            ║
╚══════════════════════════════════════════════════════════════════════╝

QUÉ PRUEBA ESTE ARCHIVO
    Los endpoints HTTP de noticias (backend/api/v1/endpoints/noticias.py),
    llamándolos como lo haría el frontend, pero sin levantar el servidor:
    FastAPI trae un "TestClient" que manda las peticiones directo a la app.

    | Método | Ruta                    | Quién puede usarlo | Respuesta OK |
    |--------|-------------------------|--------------------|--------------|
    | GET    | /api/v1/noticias/       | Cualquiera         | 200          |
    | GET    | /api/v1/noticias/{id}   | Cualquiera         | 200 / 404    |
    | POST   | /api/v1/noticias/       | Solo admin         | 201          |
    | PATCH  | /api/v1/noticias/{id}   | Solo admin         | 200          |
    | DELETE | /api/v1/noticias/{id}   | Solo admin         | 204          |

NOTIBUG (nombre interno del equipo)
    En la devolución del Sprint 4 se observó que los tests de EDITAR y
    ELIMINAR tenían aserciones débiles:

        assert response.status_code in [200, 401, 403, 404]        # editar
        assert response.status_code in [200, 204, 401, 403, 404]   # eliminar

    Aceptaban casi cualquier respuesta, así que NUNCA podían fallar: si
    alguien sacaba la protección de administrador, el test seguía en verde.

    Arreglo: sin token, el backend SIEMPRE tiene que responder 401 con el
    mensaje "Not authenticated". Esa respuesta es fija y conocida, así que
    el test la exige con exactitud (sección 3).

    ¿Por qué no necesitan la base? La dependencia `require_admin`
    (backend/security.py) valida el token ANTES de que se ejecute el
    código del endpoint. Sin token, la petición se corta ahí y nunca llega
    a la consulta SQL.

CÓMO EJECUTARLO (con la salida por consola visible)
    cd backend
    ./.venv/bin/python -m pytest validaciones/test_endpoints_noticias.py -v -s

    El "-s" es necesario para ver los recuadros: sin él, pytest se guarda
    lo que imprimen los tests y solo lo muestra si fallan.

LOS 6 CASOS DEL DIAGRAMA "Endpoint Noticias" (secciones 4 y 5)
    | # | Endpoint | Token   | Rol | Datos                         | Esperado | ¿Toca la base?  |
    |---|----------|---------|-----|-------------------------------|----------|-----------------|
    | 1 | POST     | válido  | 1   | título, cuerpo e imagen OK    | 201      | Sí, guarda      |
    | 2 | POST     | válido  | 0   | título, cuerpo e imagen OK    | 403      | No              |
    | 3 | POST     | vencido | 1   | título, cuerpo e imagen OK    | 401      | No              |
    | 4 | POST     | válido  | 1   | imagen de más de 5 MB         | 400      | No              |
    | 5 | PATCH    | válido  | 1   | id existente + datos nuevos   | 200      | Sí, actualiza   |
    | 6 | PATCH    | válido  | 1   | id que NO existe              | 404      | Solo lee        |

    Estos tests no usan la base real: la reemplazan por una "base falsa"
    que responde lo justo y ANOTA cada consulta. Así, además del código
    de respuesta, se verifica qué hizo el backend con la base.

ESTRUCTURA
    0. Preparación (imports y cliente de prueba)
    1. Herramientas de salida por consola
    2. Lectura pública (necesita la base de datos)
    3. Escritura protegida — NOTIBUG (no necesita la base)
    4. Herramientas de los 6 casos: tokens, imágenes y base falsa
    5. Los 6 casos del diagrama
"""


# ══════════════════════════════════════════════════════════════════════
# 0. PREPARACIÓN
# ══════════════════════════════════════════════════════════════════════

import json
import os
import sys

# Los tests viven en backend/validaciones/, pero main.py está en backend/.
# Agregamos la carpeta padre al path para que "from main import app" funcione.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402  (la aplicación FastAPI completa, con todas sus rutas)

# El cliente de prueba: se usa igual que "requests" (client.get, client.post...)
# pero en vez de salir a la red, le pasa la petición directo a la app.
client = TestClient(app)

# Prefijo común de todas las rutas de noticias.
RUTA_NOTICIAS = "/api/v1/noticias"

# Respuesta fija que da FastAPI cuando falta el header "Authorization".
RESPUESTA_SIN_TOKEN = {"detail": "Not authenticated"}


# ══════════════════════════════════════════════════════════════════════
# 1. HERRAMIENTAS DE SALIDA POR CONSOLA
# ══════════════════════════════════════════════════════════════════════
# Cada test imprime un recuadro como este (los colores solo aparecen si
# la consola los soporta):
#
#   ╭────────────────────────────────────────────────────────────────╮
#   │  NOTIBUG · Editar una noticia sin token                        │
#   ├────────────────────────────────────────────────────────────────┤
#   │  Petición   PATCH /api/v1/noticias/1                           │
#   │  Token      (ninguno)                                          │
#   │  Esperado   401  {"detail": "Not authenticated"}               │
#   │  Obtenido   401  {"detail": "Not authenticated"}               │
#   ├────────────────────────────────────────────────────────────────┤
#   │  ✔ APROBADO                                                    │
#   ╰────────────────────────────────────────────────────────────────╯

ANCHO = 78  # ancho interior del recuadro, en caracteres

# Colores ANSI. Solo se usan si la salida es una terminal de verdad; si se
# redirige a un archivo (por ejemplo, un reporte .txt), queda texto limpio.
_USAR_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _color(texto: str, codigo: str) -> str:
    """Pinta el texto con un código ANSI (si la terminal lo permite)."""
    return f"\033[{codigo}m{texto}\033[0m" if _USAR_COLOR else texto


def _verde(texto: str) -> str:
    return _color(texto, "1;32")


def _rojo(texto: str) -> str:
    return _color(texto, "1;31")


def _cian(texto: str) -> str:
    return _color(texto, "1;36")


def _gris(texto: str) -> str:
    return _color(texto, "2")


def _linea(contenido: str = "", pintar=None) -> str:
    """Una fila del recuadro: rellena con espacios hasta ANCHO y después
    aplica el color (si se rellenara ya coloreado, los códigos ANSI
    contarían como caracteres y el borde derecho quedaría corrido)."""
    texto = f"  {contenido}"
    if len(texto) > ANCHO:
        texto = texto[: ANCHO - 1] + "…"
    texto = texto.ljust(ANCHO)
    return f"│{pintar(texto) if pintar else texto}│"


def _json_corto(respuesta) -> str:
    """El cuerpo de la respuesta en una sola línea (o un aviso si no es JSON)."""
    try:
        cuerpo = respuesta.json()
    except ValueError:
        return "(sin cuerpo JSON)"
    # Una noticia completa no entra en una línea: se muestra id y título.
    if isinstance(cuerpo, dict) and {"id", "titulo"} <= cuerpo.keys():
        return f'noticia id={cuerpo["id"]}, "{cuerpo["titulo"]}"'
    return json.dumps(cuerpo, ensure_ascii=False)


def mostrar_resultado(titulo, metodo, ruta, token, esperado, respuesta, aprobado, extra=()):
    """Imprime el recuadro de un test.

    Se llama ANTES de los assert, para que el recuadro aparezca siempre,
    también cuando el test falla (y así se ve qué llegó en realidad).

    `extra` son filas opcionales (etiqueta, valor) que van debajo de la
    del token: los 6 casos del diagrama la usan para el rol, los datos
    enviados y lo que pasó en la base.
    """
    filas_extra = [_linea(f"{etiqueta:<10} {valor}") for etiqueta, valor in extra]
    estado = _verde("✔ APROBADO".ljust(ANCHO - 2)) if aprobado else _rojo("✘ FALLÓ".ljust(ANCHO - 2))
    print()  # pytest -v deja el nombre del test en la misma línea: bajamos una
    print("╭" + "─" * ANCHO + "╮")
    print(_linea(titulo, _cian))
    print("├" + "─" * ANCHO + "┤")
    print(_linea(f"Petición   {metodo} {ruta}"))
    print(_linea(f"Token      {token}"))
    for fila in filas_extra:
        print(fila)
    print(_linea(f"Esperado   {esperado}"))
    print(_linea(f"Obtenido   {respuesta.status_code}  {_json_corto(respuesta)}"))
    print("├" + "─" * ANCHO + "┤")
    print(f"│  {estado}│")
    print("╰" + "─" * ANCHO + "╯")


@pytest.fixture(scope="module", autouse=True)
def encabezado():
    """Imprime un título una sola vez, antes del primer test del archivo,
    y un cierre al terminar el último."""
    print("\n")
    print(_cian("═" * (ANCHO + 2)))
    print(_cian("  MÓDULO NOTICIAS · tests de endpoints".ljust(ANCHO + 2)))
    print(_gris("  Lectura pública (necesita base) + escritura protegida (NOTIBUG)"))
    print(_cian("═" * (ANCHO + 2)))
    yield
    print()
    print(_gris("─" * (ANCHO + 2)))
    print(_gris("  Fin de los tests de noticias"))
    print(_gris("─" * (ANCHO + 2)))


# ══════════════════════════════════════════════════════════════════════
# 2. LECTURA PÚBLICA  (necesita la base de datos)
# ══════════════════════════════════════════════════════════════════════
# Estos endpoints no piden token, así que la petición SÍ llega a la
# consulta SQL. Sin DATABASE_URL en el .env fallan con:
#     ValueError: Falta DATABASE_URL en el .env
# Para que corran en cualquier máquina habría que agregar un conftest.py
# con una base de prueba aislada (pendiente).


def test_listar_noticias_endpoint_exito():
    """GET /noticias/ → 200 y una lista (puede venir vacía)."""
    # --- Arrange (preparar) ---
    ruta = f"{RUTA_NOTICIAS}/"

    # --- Act (ejecutar) ---
    response = client.get(ruta)

    # --- Assert (verificar) ---
    aprobado = response.status_code == 200 and isinstance(response.json(), list)
    mostrar_resultado(
        "Listar noticias (público)", "GET", ruta, "(no hace falta)",
        "200  [ ...lista de noticias... ]", response, aprobado,
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_obtener_noticia_no_encontrada_endpoint():
    """GET /noticias/99999 → 404 con un mensaje claro."""
    # --- Arrange ---
    noticia_id_inexistente = 99999  # un id que no debería existir nunca
    ruta = f"{RUTA_NOTICIAS}/{noticia_id_inexistente}"

    # --- Act ---
    response = client.get(ruta)

    # --- Assert ---
    esperado = {"detail": "Noticia no encontrada"}
    aprobado = response.status_code == 404 and response.json() == esperado
    mostrar_resultado(
        "Buscar una noticia que no existe", "GET", ruta, "(no hace falta)",
        f"404  {json.dumps(esperado, ensure_ascii=False)}", response, aprobado,
    )
    assert response.status_code == 404
    assert response.json() == esperado


# ══════════════════════════════════════════════════════════════════════
# 3. ESCRITURA PROTEGIDA — NOTIBUG  (no necesita la base)
# ══════════════════════════════════════════════════════════════════════
# Crear, editar y eliminar son solo para administradores. Los tres
# endpoints declaran `admin: dict = Depends(require_admin)`, y FastAPI
# resuelve esa dependencia ANTES de entrar a la función:
#
#     petición ──► ¿hay token? ──no──► 401 "Not authenticated"  (fin)
#                      │
#                      sí
#                      ▼
#                 ¿rol == 1? ──no──► 403 "Requiere permisos de administrador"
#                      │
#                      sí
#                      ▼
#                 código del endpoint (recién acá se toca la base)
#
# Estos tests mandan la petición SIN token, así que siempre terminan en
# la primera rama: el resultado es 401, siempre, con o sin base.


def test_crear_noticia_sin_autenticacion_falla():
    """POST /noticias/ sin token → rechazado."""
    # --- Arrange ---
    # Datos válidos a propósito: si el test falla, no es por el título o
    # el cuerpo (eso daría 422), sino por la falta de token.
    ruta = f"{RUTA_NOTICIAS}/"
    payload_noticia = {
        "titulo": "Título de prueba automatizada",
        "cuerpo": "Cuerpo de la noticia con la longitud mínima requerida para pasar las reglas.",
    }

    # --- Act ---
    # "data=" manda un formulario (form-data), que es lo que espera el endpoint.
    response = client.post(ruta, data=payload_noticia)

    # --- Assert ---
    aprobado = response.status_code in [401, 403]
    mostrar_resultado(
        "Crear una noticia sin token", "POST", ruta, "(ninguno)",
        "401 o 403", response, aprobado,
    )
    assert response.status_code in [401, 403]


def test_actualizar_noticia_sin_token_responde_401():
    """NOTIBUG · PATCH /noticias/1 sin token → exactamente 401.

    Antes:  assert response.status_code in [200, 401, 403, 404]   ← no podía fallar
    Ahora:  exige 401 y el mensaje exacto.
    """
    # --- Arrange ---
    noticia_id = 1  # da igual si existe: el pedido se corta antes de buscarla
    ruta = f"{RUTA_NOTICIAS}/{noticia_id}"
    payload_actualizado = {
        "titulo": "Título actualizado automatizado",
        "cuerpo": "Cuerpo actualizado de la noticia con la longitud mínima requerida para pasar las reglas.",
    }

    # --- Act ---
    # El endpoint está definido con @router.patch, por eso client.patch.
    response = client.patch(ruta, data=payload_actualizado)

    # --- Assert ---
    aprobado = response.status_code == 401 and response.json() == RESPUESTA_SIN_TOKEN
    mostrar_resultado(
        "NOTIBUG · Editar una noticia sin token", "PATCH", ruta, "(ninguno)",
        f"401  {json.dumps(RESPUESTA_SIN_TOKEN)}", response, aprobado,
    )
    assert response.status_code == 401
    assert response.json() == RESPUESTA_SIN_TOKEN


def test_eliminar_noticia_sin_token_responde_401():
    """NOTIBUG · DELETE /noticias/1 sin token → exactamente 401.

    Antes:  assert response.status_code in [200, 204, 401, 403, 404]   ← no podía fallar
    Ahora:  exige 401 y el mensaje exacto.
    """
    # --- Arrange ---
    noticia_id = 1  # como en editar: no se llega a consultar la base
    ruta = f"{RUTA_NOTICIAS}/{noticia_id}"

    # --- Act ---
    response = client.delete(ruta)

    # --- Assert ---
    aprobado = response.status_code == 401 and response.json() == RESPUESTA_SIN_TOKEN
    mostrar_resultado(
        "NOTIBUG · Eliminar una noticia sin token", "DELETE", ruta, "(ninguno)",
        f"401  {json.dumps(RESPUESTA_SIN_TOKEN)}", response, aprobado,
    )
    assert response.status_code == 401
    assert response.json() == RESPUESTA_SIN_TOKEN


# ══════════════════════════════════════════════════════════════════════
# 4. HERRAMIENTAS DE LOS 6 CASOS: TOKENS, IMÁGENES Y BASE FALSA
# ══════════════════════════════════════════════════════════════════════

from datetime import datetime, timedelta, timezone  # noqa: E402

import jwt  # noqa: E402

import security  # noqa: E402
from api.v1.endpoints import noticias as endpoint_noticias  # noqa: E402

# ── 4.1 Tokens ────────────────────────────────────────────────────────
# El backend firma los tokens con JWT_SECRET_KEY (viene del .env). Para
# no depender del .env, los tests usan una clave propia: el fixture
# `clave_de_prueba` la pone en security.py mientras dura cada test, así
# los tokens que firmamos acá son los que el backend acepta.

CLAVE_DE_PRUEBA = "clave-solo-para-tests-de-vidriera-productiva"  # 32+ caracteres, como pide HS256

ROL_USUARIO = 0  # representante de una empresa
ROL_ADMIN = 1    # administrador del ministerio


@pytest.fixture
def clave_de_prueba(monkeypatch):
    monkeypatch.setattr(security, "JWT_SECRET_KEY", CLAVE_DE_PRUEBA)


def token(rol: int, vencido: bool = False) -> dict:
    """Arma el header Authorization con un JWT como el que devuelve el login.

    - rol:     0 = usuario común, 1 = administrador.
    - vencido: True le pone una fecha de vencimiento de hace una hora.
    """
    ahora = datetime.now(timezone.utc)
    vence = ahora - timedelta(hours=1) if vencido else ahora + timedelta(hours=1)
    payload = {"sub": "1", "email": "admin@vidriera.com", "rol": rol, "exp": vence}
    firmado = jwt.encode(payload, CLAVE_DE_PRUEBA, algorithm=security.JWT_ALGORITHM)
    return {"Authorization": f"Bearer {firmado}"}


# ── 4.2 Datos de una noticia ──────────────────────────────────────────
# El endpoint recibe un formulario (multipart/form-data): los textos van
# en "data=" y la imagen en "files=".

DATOS_VALIDOS = {
    "titulo": "Feria de productores en Villa María",
    "cuerpo": "Más de cincuenta empresas cordobesas mostrarán sus productos este fin de semana.",
}

LIMITE_IMAGEN = endpoint_noticias.TAMANIO_MAXIMO_MB * 1024 * 1024  # 5 MB en bytes


def imagen(tamanio: int = 1024, nombre: str = "portada.png") -> dict:
    """Una imagen de mentira para subir. El backend solo mira la extensión
    del nombre y el tamaño, así que alcanza con bytes cualquiera."""
    return {"imagen": (nombre, b"\0" * tamanio, "image/png")}


# ── 4.3 Base falsa y carpeta de imágenes ──────────────────────────────
# Reemplaza a execute_query() en el endpoint de noticias. Responde lo
# mínimo para que el endpoint funcione y guarda cada consulta en
# `self.consultas` para verificarlas después.
#
# En esta versión (Oracle) la imagen NO va a la base: se guarda como
# archivo en backend/uploads/noticias/ y la tabla solo guarda el nombre.
# Los fixtures cambian esa carpeta por una temporal de pytest
# (`tmp_path`), así los tests no dejan archivos en uploads/.

IMAGEN_VIEJA = "vieja.png"  # imagen que ya tenía la noticia id 1


class BaseFalsa:
    def __init__(self, noticia=None):
        # La noticia "guardada": (id, titulo, cuerpo, imagen_archivo, fecha, estado)
        # o None si no hay ninguna.
        self.noticia = noticia
        self.consultas = []

    def __call__(self, query, params=None, fetch=False):
        sql = " ".join(query.split())
        self.consultas.append(sql)

        if sql.startswith("INSERT INTO noticias"):
            self.noticia = (10, params["titulo"], params["cuerpo"], params["imagen"], params["fecha"], 1)
            return None
        if sql.startswith("UPDATE noticias"):
            id_, _, _, _, fecha, estado = self.noticia
            self.noticia = (id_, params["titulo"], params["cuerpo"], params["imagen"], fecha, estado)
            return None
        if sql.startswith("SELECT"):
            return [self.noticia] if self.noticia else []
        return None  # DELETE, etc.

    # Consultas que cambian datos (todo lo que no sea un SELECT).
    def escrituras(self):
        return [c for c in self.consultas if not c.startswith("SELECT")]

    def resumen(self) -> str:
        """Lo que pasó en la base, en una línea, para el recuadro."""
        if not self.consultas:
            return "no se tocó"
        # Muestra las escrituras en orden y al final cuántas lecturas hubo:
        #   "UPDATE noticias (+2 lecturas)"
        def verbo(c):
            palabras = c.split()
            # "INSERT INTO noticias" / "DELETE FROM noticias" → tabla en la 3.ª palabra;
            # "UPDATE noticias" → tabla en la 2.ª.
            tabla = palabras[1] if palabras[0] == "UPDATE" else palabras[2]
            return f"{palabras[0]} {tabla}"

        escrituras = [verbo(c) for c in self.escrituras()]
        lecturas = len(self.consultas) - len(escrituras)
        if not escrituras:
            return f"solo lectura ({lecturas} SELECT)"
        sufijo = f" (+{lecturas} lectura{'s' if lecturas != 1 else ''})" if lecturas else ""
        return " → ".join(escrituras) + sufijo


@pytest.fixture
def carpeta_imagenes(monkeypatch, tmp_path):
    """Carpeta temporal en lugar de backend/uploads/noticias/."""
    monkeypatch.setattr(endpoint_noticias, "UPLOADS_DIR", tmp_path)
    return tmp_path


def archivos(carpeta) -> list:
    """Nombres de las imágenes que hay en la carpeta."""
    return sorted(a.name for a in carpeta.iterdir())


@pytest.fixture
def base_vacia(monkeypatch, clave_de_prueba, carpeta_imagenes):
    """Base falsa sin noticias (para crear, o para el id inexistente)."""
    base = BaseFalsa()
    base.carpeta = carpeta_imagenes
    monkeypatch.setattr(endpoint_noticias, "execute_query", base)
    return base


@pytest.fixture
def base_con_noticia(monkeypatch, clave_de_prueba, carpeta_imagenes):
    """Base falsa con la noticia id 1 ya cargada, con su imagen en disco (para editar)."""
    (carpeta_imagenes / IMAGEN_VIEJA).write_bytes(b"\0")
    existente = (1, "Título viejo", "Cuerpo viejo de la noticia.", IMAGEN_VIEJA, datetime(2026, 10, 1), 1)
    base = BaseFalsa(noticia=existente)
    base.carpeta = carpeta_imagenes
    monkeypatch.setattr(endpoint_noticias, "execute_query", base)
    return base


# ══════════════════════════════════════════════════════════════════════
# 5. LOS 6 CASOS DEL DIAGRAMA
# ══════════════════════════════════════════════════════════════════════
# Recordatorio del orden de los controles del backend:
#   1) token presente y válido  → si no, 401
#   2) rol == 1 (admin)          → si no, 403
#   3) título y cuerpo           → si no, 422
#   4) imagen (formato y tamaño) → si no, 400
#   5) recién acá se guarda o se busca en la base


def test_caso1_crear_noticia_admin_responde_201(base_vacia):
    """CASO 1 · Admin con token válido y datos correctos → 201 y se guarda."""
    # --- Arrange ---
    ruta = f"{RUTA_NOTICIAS}/"

    # --- Act ---
    response = client.post(ruta, data=DATOS_VALIDOS, files=imagen(), headers=token(ROL_ADMIN))

    # --- Assert ---
    cuerpo = response.json()
    aprobado = (
        response.status_code == 201
        and cuerpo.get("titulo") == DATOS_VALIDOS["titulo"]
        and "/uploads/noticias/" in (cuerpo.get("imagen_url") or "")
        and any(c.startswith("INSERT INTO noticias") for c in base_vacia.consultas)
    )
    mostrar_resultado(
        "CASO 1 · Crear noticia como admin", "POST", ruta, "válido",
        "201  y la noticia se guarda en la base", response, aprobado,
        extra=[("Rol", "1 (admin)"), ("Datos", "título, cuerpo e imagen OK"),
               ("Base", base_vacia.resumen())],
    )
    assert response.status_code == 201
    assert cuerpo["titulo"] == DATOS_VALIDOS["titulo"]
    # La imagen quedó guardada en disco y la URL apunta a ese archivo.
    guardadas = archivos(base_vacia.carpeta)
    assert len(guardadas) == 1 and guardadas[0].endswith(".png")
    assert cuerpo["imagen_url"].endswith(f"/uploads/noticias/{guardadas[0]}")
    assert any(c.startswith("INSERT INTO noticias") for c in base_vacia.consultas)


def test_caso2_crear_noticia_con_rol_usuario_responde_403(base_vacia):
    """CASO 2 · Token válido pero de un usuario común (rol 0) → 403, sin tocar la base."""
    # --- Arrange ---
    ruta = f"{RUTA_NOTICIAS}/"
    esperado = {"detail": "Requiere permisos de administrador"}

    # --- Act ---
    response = client.post(ruta, data=DATOS_VALIDOS, files=imagen(), headers=token(ROL_USUARIO))

    # --- Assert ---
    aprobado = response.status_code == 403 and response.json() == esperado and not base_vacia.consultas
    mostrar_resultado(
        "CASO 2 · Crear noticia con rol de usuario", "POST", ruta, "válido",
        f"403  {json.dumps(esperado, ensure_ascii=False)}", response, aprobado,
        extra=[("Rol", "0 (usuario)"), ("Datos", "título, cuerpo e imagen OK"),
               ("Base", base_vacia.resumen())],
    )
    assert response.status_code == 403
    assert response.json() == esperado
    assert base_vacia.consultas == []  # el pedido se cortó antes de la base


def test_caso3_crear_noticia_con_token_vencido_responde_401(base_vacia):
    """CASO 3 · Admin con token vencido → 401, sin tocar la base."""
    # --- Arrange ---
    ruta = f"{RUTA_NOTICIAS}/"
    esperado = {"detail": "Token expirado"}

    # --- Act ---
    response = client.post(ruta, data=DATOS_VALIDOS, files=imagen(),
                           headers=token(ROL_ADMIN, vencido=True))

    # --- Assert ---
    aprobado = response.status_code == 401 and response.json() == esperado and not base_vacia.consultas
    mostrar_resultado(
        "CASO 3 · Crear noticia con token vencido", "POST", ruta, "vencido hace 1 hora",
        f"401  {json.dumps(esperado, ensure_ascii=False)}", response, aprobado,
        extra=[("Rol", "1 (admin)"), ("Datos", "título, cuerpo e imagen OK"),
               ("Base", base_vacia.resumen())],
    )
    assert response.status_code == 401
    assert response.json() == esperado
    assert base_vacia.consultas == []


def test_caso4_crear_noticia_con_imagen_de_mas_de_5mb_responde_400(base_vacia):
    """CASO 4 · Admin con imagen de 5 MB + 1 byte → 400, sin tocar la base.

    Se usa justo un byte más que el límite (valor límite): prueba que el
    corte está exactamente en 5 MB.
    """
    # --- Arrange ---
    ruta = f"{RUTA_NOTICIAS}/"
    esperado = {"detail": "La imagen supera el tamaño máximo permitido (5 MB)"}

    # --- Act ---
    response = client.post(ruta, data=DATOS_VALIDOS, files=imagen(tamanio=LIMITE_IMAGEN + 1),
                           headers=token(ROL_ADMIN))

    # --- Assert ---
    aprobado = response.status_code == 400 and response.json() == esperado and not base_vacia.consultas
    mostrar_resultado(
        "CASO 4 · Crear noticia con imagen > 5 MB", "POST", ruta, "válido",
        "400  la imagen supera el máximo (5 MB)", response, aprobado,
        extra=[("Rol", "1 (admin)"), ("Datos", "imagen de 5 MB + 1 byte"),
               ("Base", base_vacia.resumen())],
    )
    assert response.status_code == 400
    assert response.json() == esperado
    assert base_vacia.consultas == []          # la noticia no se guardó
    assert archivos(base_vacia.carpeta) == []  # ni la imagen


def test_caso5_editar_noticia_admin_responde_200(base_con_noticia):
    """CASO 5 · Admin edita una noticia que existe → 200 y se actualiza."""
    # --- Arrange ---
    ruta = f"{RUTA_NOTICIAS}/1"

    # --- Act ---
    response = client.patch(ruta, data=DATOS_VALIDOS, files=imagen(), headers=token(ROL_ADMIN))

    # --- Assert ---
    cuerpo = response.json()
    aprobado = (
        response.status_code == 200
        and cuerpo.get("id") == 1
        and cuerpo.get("titulo") == DATOS_VALIDOS["titulo"]
        and any(c.startswith("UPDATE noticias") for c in base_con_noticia.consultas)
    )
    mostrar_resultado(
        "CASO 5 · Editar noticia como admin", "PATCH", ruta, "válido",
        "200  y la noticia se actualiza en la base", response, aprobado,
        extra=[("Rol", "1 (admin)"), ("Datos", "id 1 + título, cuerpo e imagen"),
               ("Base", base_con_noticia.resumen())],
    )
    assert response.status_code == 200
    assert cuerpo["id"] == 1
    assert cuerpo["titulo"] == DATOS_VALIDOS["titulo"]
    # Imagen nueva guardada en disco y la vieja borrada (no queda huérfana).
    guardadas = archivos(base_con_noticia.carpeta)
    assert len(guardadas) == 1 and guardadas[0] != IMAGEN_VIEJA
    assert cuerpo["imagen_url"].endswith(f"/uploads/noticias/{guardadas[0]}")
    assert any(c.startswith("UPDATE noticias") for c in base_con_noticia.consultas)


def test_caso6_editar_noticia_inexistente_responde_404(base_vacia):
    """CASO 6 · Admin edita un id que no existe → 404, sin cambiar nada.

    Diferencia con el diagrama: el diagrama dice "no interactúa" con la
    base, pero para saber que el id no existe el backend tiene que
    buscarlo (un SELECT). Lo que el test verifica es que NO escribe nada.
    """
    # --- Arrange ---
    ruta = f"{RUTA_NOTICIAS}/99999"
    esperado = {"detail": "Noticia no encontrada"}

    # --- Act ---
    response = client.patch(ruta, data=DATOS_VALIDOS, files=imagen(), headers=token(ROL_ADMIN))

    # --- Assert ---
    aprobado = response.status_code == 404 and response.json() == esperado and not base_vacia.escrituras()
    mostrar_resultado(
        "CASO 6 · Editar una noticia que no existe", "PATCH", ruta, "válido",
        f"404  {json.dumps(esperado, ensure_ascii=False)}", response, aprobado,
        extra=[("Rol", "1 (admin)"), ("Datos", "id 99999 (no existe)"),
               ("Base", base_vacia.resumen())],
    )
    assert response.status_code == 404
    assert response.json() == esperado
    assert base_vacia.escrituras() == []       # no se actualizó nada
    assert archivos(base_vacia.carpeta) == []  # ni se guardó la imagen
