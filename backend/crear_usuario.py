import os
from datetime import datetime
import oracledb
from dotenv import load_dotenv

load_dotenv()

# Variables de conexión desde el .env
user = os.getenv('DB_USER')
dsn = os.getenv('DB_CONNECTION')
pwd = os.getenv('PASSWORD')

# Datos del usuario de prueba
nombre = "Franco"
apellido = "Avila"
email = "francoavila9356@gmail.com"
password = "Password123"  # Contraseña para pruebas
telefono = "3511234567"
rol = 1      # 0 = Usuario, 1 = Administrador
estado = 1   # 1 = Activo

def registrar_usuario():
    # Consulta SQL adaptada al esquema de Oracle
    query = """
        INSERT INTO representates (
            nombre_representante,
            apellido_representante,
            email_representante,
            contrasenia_representate,
            n_telefono_representante,
            fecha_de_creacion,
            rol,
            estado
        ) VALUES (
            :1, :2, :3, :4, :5, :6, :7, :8
        )
    """
    
    try:
        print(f"Conectando a Oracle ({dsn}) como {user}...")
        with oracledb.connect(user=user, password=pwd, dsn=dsn) as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, (
                    nombre,
                    apellido,
                    email,
                    password,
                    telefono,
                    datetime.now(),
                    rol,
                    estado
                ))
                # Confirmar cambios en la base de datos
                connection.commit()
                print(" Usuario registrado exitosamente en la base de datos.")
                
                # Verificar leyendo el registro insertado
                cursor.execute(
                    "SELECT id_representante, email_representante, rol FROM representates WHERE email_representante = :1", 
                    (email,)
                )
                res = cursor.fetchone()
                print(f" Datos en DB: ID={res[0]} | Email={res[1]} | Rol={res[2]}")
                
    except Exception as e:
        print(f" Error al registrar usuario: {e}")

if __name__ == "__main__":
    registrar_usuario()