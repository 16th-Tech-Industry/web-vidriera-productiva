from fastapi import APIRouter, HTTPException, status
from typing import List
from api.v1.schemas.user import UserCreate, UserUpdate, UserResponse

"""
Los retornos con datos simulados (mocks) tienen tres objetivos técnicos en esta etapa de desarrollo:

    Cumplir con el contrato de Pydantic: Al definir response_model=UserResponse, FastAPI valida que la salida tenga exactamente esa estructura. Si devuelves algo distinto o vacío, la API fallará con un error 500 (Internal Server Error).

    Desacoplar el desarrollo (API First): Permite que cualquier cliente (Postman, otro microservicio, o un equipo de UI) pueda integrar y probar los endpoints de inmediato, sin depender de que la base de datos esté configurada.

    Preparar la integración del ORM: Funcionan como marcadores (placeholders). Cuando conectes tu base de datos, simplemente cambias ese diccionario por el objeto real (ej. return db_user). 
    FastAPI se encarga de serializarlo automáticamente al JSON esperado gracias a la configuración from_attributes = True del schema.

"""


router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    # TODO: Validar si el email existe -> 400
    # TODO: Hashear user.password
    # TODO: Guardar en DB
    return {"id": 1, "email": user.email, "name": user.name, "is_active": True}

@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100):
    # TODO: db.query(User).offset(skip).limit(limit).all()
    return [{"id": 1, "email": "admin@mail.com", "name": "Admin", "is_active": True}]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    # TODO: Buscar en DB
    # if not db_user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"id": user_id, "email": "admin@mail.com", "name": "Admin", "is_active": True}

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate):
    # TODO: Buscar usuario en DB -> 404 si no existe
    # TODO: Actualizar solo los campos enviados: user.model_dump(exclude_unset=True)
    # TODO: Si envía password, hashearla antes de guardar
    return {"id": user_id, "email": "admin@mail.com", "name": "Admin", "is_active": True}

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
    # TODO: Buscar usuario -> 404 si no existe
    # TODO: Eliminar de DB (o hacer soft delete seteando is_active=False)
    return None # 204 no debe devolver body