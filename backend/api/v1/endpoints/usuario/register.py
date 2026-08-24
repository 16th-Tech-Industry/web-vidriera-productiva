from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from api.v1.schemas.users import UserCreate, UserResponse
from db_connector import execute_query
from security import hash_password

router = APIRouter(prefix="/register", tags=["Register"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    existe = execute_query(
        "SELECT id_representante FROM representates WHERE email_representante = :email",
        {"email": user.email},
        fetch=True,
    )
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    # estado=1 (activo) porque todavía no hay verificación de cuenta por mail.
    execute_query(
        "INSERT INTO representates "
        "(nombre_representante, apellido_representante, email_representante, "
        "contrasenia_representate, fecha_de_creacion, estado) "
        "VALUES (:nombre, :apellido, :email, :password_hash, :fecha, :estado)",
        {
            "nombre": user.name,
            "apellido": user.apellido,
            "email": user.email,
            "password_hash": hash_password(user.password),
            "fecha": datetime.now(),
            "estado": 1,
        },
    )

    nuevo = execute_query(
        "SELECT id_representante FROM representates WHERE email_representante = :email",
        {"email": user.email},
        fetch=True,
    )
    return {"id": nuevo[0][0], "email": user.email, "name": user.name, "is_active": True}
