import os, oracledb
from dotenv import load_dotenv

load_dotenv()

user = os.getenv('DB_USER')
dsn = os.getenv('DB_CONNECTION')
pwd = os.getenv('PASSWORD')

def execute_query(query: str, params=None, fetch=False):
    with oracledb.connect(user=user, password=pwd, dsn=dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            if fetch:
                return cursor.fetchall()
            return None