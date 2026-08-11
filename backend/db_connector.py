import os, oracledb

user = os.getenv('DB_USER')
connection = os.getenv('DB_CONNECTION')
pwd = os.getenv('PASSWORD')

def execute_query(query: str, params= str, fetch=False):
    with oracledb.connect(user=user, password=pwd, dsn=connection) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            if fetch:
                return cursor.fetchall()
            return None