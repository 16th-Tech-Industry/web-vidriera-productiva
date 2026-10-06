from fastapi import APIRouter, status, Depends, HTTPException
from typing import List

from api.v1.schemas.users import UserResponse, UserRoleUpdate
from db_connector import execute_query
from security import require_admin

"""
Los retornos con datos simulados (mocks) tienen tres objetivos técnicos en esta etapa de desarrollo:

    Cumplir con el contrato de Pydantic: Al definir response_model=UserResponse, FastAPI valida que la salida tenga exactamente esa estructura. Si devuelves algo distinto o vacío, la API fallará con un error 500 (Internal Server Error).

    Desacoplar el desarrollo (API First): Permite que cualquier cliente (Postman, otro microservicio, o un equipo de UI) pueda integrar y probar los endpoints de inmediato, sin depender de que la base de datos esté configurada.

    Preparar la integración del ORM: Funcionan como marcadores (placeholders). Cuando conectes tu base de datos, simplemente cambias ese diccionario por el objeto real (ej. return db_user).
    FastAPI se encarga de serializarlo automáticamente al JSON esperado gracias a la configuración from_attributes = True del schema.

"""


router = APIRouter(prefix="/users", tags=["Users"])

# NOTA: el registro (create_user) vive en usuario/register.py y el login +
# recuperación de contraseña en usuario/login.py. Este archivo queda
# exclusivo para el CRUD de usuarios.

_SELECT_USER = (
    "SELECT id_representante, nombre_representante, apellido_representante, "
    "email_representante, n_telefono_representante, rol, estado FROM representates"
)


def _fila_a_response(fila) -> UserResponse:
    id_rep, nombre, apellido, email, telefono, rol, estado = fila
    return UserResponse(
        id=id_rep,
        name=nombre,
        apellido=apellido,
        email=email,
        telefono=telefono,
        role=int(rol or 0),
        is_active=bool(estado),
    )


def _existe_usuario(user_id: int) -> bool:
    filas = execute_query(
        "SELECT 1 FROM representates WHERE id_representante = :id",
        {"id": user_id},
        fetch=True,
    )
    return bool(filas)


@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin)):
    filas = execute_query(
        _SELECT_USER + " ORDER BY id_representante OFFSET :skip ROWS FETCH NEXT :limit ROWS ONLY",
        {"skip": skip, "limit": limit},
        fetch=True,
    )
    return [_fila_a_response(f) for f in filas]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, admin: dict = Depends(require_admin)):
    filas = execute_query(
        _SELECT_USER + " WHERE id_representante = :id",
        {"id": user_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return _fila_a_response(filas[0])


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserRoleUpdate, admin: dict = Depends(require_admin)):
    """Cambia el rol de un usuario. Exclusivo de administradores."""
    if int(admin["sub"]) == user_id and data.role == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés quitarte a vos mismo el permiso de administrador",
        )
    if not _existe_usuario(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    execute_query(
        "UPDATE representates SET rol = :rol WHERE id_representante = :id",
        {"rol": data.role, "id": user_id},
    )

    actualizado = execute_query(
        _SELECT_USER + " WHERE id_representante = :id",
        {"id": user_id},
        fetch=True,
    )
    return _fila_a_response(actualizado[0])


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    """Baja lógica: pone estado = 0 en lugar de borrar la fila."""
    if int(admin["sub"]) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No podés darte de baja a vos mismo")
    if not _existe_usuario(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    execute_query("UPDATE representates SET estado = 0 WHERE id_representante = :id", {"id": user_id})
    return None