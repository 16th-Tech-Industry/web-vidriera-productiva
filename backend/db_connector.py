import os
from pathlib import Path
import oracledb
from dotenv import load_dotenv

# Fuerza la búsqueda del .env en la raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'

# Carga el .env
load_dotenv(dotenv_path=env_path)
load_dotenv()  # Fallback adicional

"""
Pool de conexiones Oracle.

Antes, execute_query() abría y cerraba una conexión Oracle nueva en
CADA llamada (oracledb.connect(...)). El handshake de conexión (TCP +
negociación TNS + autenticación) es, para el volumen de datos que
maneja este proyecto (decenas/cientos de empresas), mucho más lento
que la query en sí: terminaba siendo el cuello de botella real de la
velocidad de carga de la web, no el motor de base de datos.

La solución estándar es un POOL: se abren unas pocas conexiones una
sola vez (perezosamente, en el primer request) y cada llamada a
execute_query() "toma prestada" una (pool.acquire()) y la devuelve al
salir del `with` (no se cierra la conexión física, vuelve al pool para
que la use el próximo request).

Ver db/README.md para la justificación completa de por qué esto
alcanza sin migrar a una base no relacional.
"""

_pool: oracledb.ConnectionPool | None = None


def _get_pool() -> oracledb.ConnectionPool:
    """Crea el pool la primera vez que se necesita y lo reutiliza después."""
    global _pool
    if _pool is not None:
        return _pool

    user = os.getenv('DB_USER')
    dsn = os.getenv('DB_CONNECTION')
    pwd = os.getenv('PASSWORD') or os.getenv('DB_PASSWORD')

    if not user or not pwd or not dsn:
        raise ValueError(f"Credenciales incompletas en .env: user={user}, dsn={dsn}, password_ok={bool(pwd)}")

    pool_min = int(os.getenv('DB_POOL_MIN', '2'))
    pool_max = int(os.getenv('DB_POOL_MAX', '10'))
    pool_increment = int(os.getenv('DB_POOL_INCREMENT', '1'))

    print(
        f"DEBUG DB -> Creando pool. User: '{user}', DSN: '{dsn}', "
        f"Password cargada: {bool(pwd)}, min={pool_min}, max={pool_max}"
    )

    _pool = oracledb.create_pool(
        user=user,
        password=pwd,
        dsn=dsn,
        min=pool_min,
        max=pool_max,
        increment=pool_increment,
    )
    return _pool


def close_pool() -> None:
    """Cierra el pool y libera las conexiones. Se llama al apagar la app (ver main.py)."""
    global _pool
    if _pool is not None:
        _pool.close(force=True)
        _pool = None


def execute_query(query: str, params=None, fetch=False):
    pool = _get_pool()
    with pool.acquire() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params or {})
            if fetch:
                return cursor.fetchall()
            connection.commit()
            return None
