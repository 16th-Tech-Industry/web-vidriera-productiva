import secrets
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from api.v1.schemas.users import (
    UserCreate,
    UserUpdate,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)

# Esquema para recibir las credenciales de Login
class LoginRequest(BaseModel):
    email: str
    password: str

# Se deja sin prefijo para evitar el doble /users/users
router = APIRouter(tags=["Users"])

_reset_tokens: dict[str, dict] = {}
_RESET_TOKEN_TTL = timedelta(hours=1)

@router.post("/login")
def login(credentials: LoginRequest):
    # TODO: Validar contra la base de datos de Oracle y verificar password con hash
    if credentials.email and credentials.password:
        return {
            "access_token": "token-de-prueba-jwt-123456",
            "token_type": "bearer",
            "user": {
                "email": credentials.email,
                "name": "Usuario Demo"
            }
        }
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, 
        detail="Credenciales inválidas"
    )

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    # TODO: Guardar en DB
    return {"id": 1, "email": user.email, "name": user.name, "is_active": True}

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest):
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        "email": payload.email,
        "expira_en": datetime.now(timezone.utc) + _RESET_TOKEN_TTL,
    }
    print(f"[password-reset] link para {payload.email}: /reset-password?token={token}")
    return {"message": "Si el email está registrado, enviamos instrucciones para recuperar la contraseña."}

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest):
    data = _reset_tokens.get(payload.token)
    if not data or data["expira_en"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido o expirado")
    
    del _reset_tokens[payload.token]
    return {"message": "Contraseña actualizada correctamente"}

@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100):
    return [{"id": 1, "email": "admin@mail.com", "name": "Admin", "is_active": True}]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    return {"id": user_id, "email": "admin@mail.com", "name": "Admin", "is_active": True}

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate):
    return {"id": user_id, "email": "admin@mail.com", "name": "Admin", "is_active": True}

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
    return None