import os
from pathlib import Path

from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

# Fuerza la búsqueda del .env en la raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'

# Carga el .env
load_dotenv(dotenv_path=env_path)
load_dotenv()  # Fallback adicional

"""
Pool de conexiones PostgreSQL (psycopg 3).

Abrir una conexión nueva en cada consulta (TCP + autenticación) es, para el
volumen de datos de este proyecto, más lento que la consulta en sí. El pool
abre unas pocas conexiones una sola vez (en el primer request) y cada llamada
a execute_query() toma una prestada y la devuelve al terminar.

La conexión sale de DATABASE_URL, que es la variable que define Railway al
agregar el servicio PostgreSQL, por ejemplo:
    postgresql://usuario:password@host:5432/base

Las consultas usan parámetros con nombre al estilo psycopg: %(nombre)s.
Un % literal dentro del SQL se escribe %%.
"""

_pool: ConnectionPool | None = None


def _get_pool() -> ConnectionPool:
    """Crea el pool la primera vez que se necesita y lo reutiliza después."""
    global _pool
    if _pool is not None:
        return _pool

    url = os.getenv('DATABASE_URL')
    if not url:
        raise ValueError("Falta DATABASE_URL en el .env (ej: postgresql://usuario:password@host:5432/base)")

    _pool = ConnectionPool(
        conninfo=url,
        min_size=int(os.getenv('DB_POOL_MIN', '2')),
        max_size=int(os.getenv('DB_POOL_MAX', '10')),
        open=True,
    )
    return _pool


def close_pool() -> None:
    """Cierra el pool y libera las conexiones. Se llama al apagar la app (ver main.py)."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def execute_query(query: str, params=None, fetch=False):
    # El bloque `with pool.connection()` hace commit al salir sin error y
    # rollback si hubo una excepción.
    with _get_pool().connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params or None)
            if fetch:
                return cursor.fetchall()
            return None
