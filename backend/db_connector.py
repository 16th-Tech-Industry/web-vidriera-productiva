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

def execute_query(query: str, params=None, fetch=False):
    # Leemos las variables dentro de la función para asegurar el valor más reciente
    user = os.getenv('DB_USER')
    dsn = os.getenv('DB_CONNECTION')
    pwd = os.getenv('PASSWORD') or os.getenv('DB_PASSWORD')

    # Imprime en la consola del backend para depuración
    print(f"DEBUG DB -> User: '{user}', DSN: '{dsn}', Password cargada: {bool(pwd)}")

    if not user or not pwd or not dsn:
        raise ValueError(f"Credenciales incompletas en .env: user={user}, dsn={dsn}, password_ok={bool(pwd)}")

    with oracledb.connect(user=user, password=pwd, dsn=dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params or {})
            if fetch:
                return cursor.fetchall()
            connection.commit()
            return None