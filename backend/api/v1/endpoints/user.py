import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from typing import List
from api.v1.schemas.users import (
    UserCreate,
    UserUpdate,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)

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

"""
Recuperación de contraseña — cómo funciona:

1. El usuario pide recuperar su clave (forgot_password) mandando solo su email.
2. Generamos un token random e imposible de adivinar (secrets.token_urlsafe),
   y lo guardamos junto al email y una fecha de expiración (1 hora).
   Hoy ese "guardado" es un dict en memoria (_reset_tokens); en producción
   sería una tabla en la DB, porque un dict en memoria se pierde si el
   server se reinicia y no funciona si hay más de una instancia corriendo.
3. Como todavía no hay servicio de mail, el token se imprime por consola
   (print) simulando el link que en un futuro llegaría al correo del usuario.
4. El usuario manda ese token + su nueva contraseña (reset_password).
   Si el token existe en el dict y no está vencido, se considera válido:
   se "actualiza" la contraseña y se borra el token para que no se
   pueda reusar (es de un solo uso).
5. Nunca confirmamos si el email existe o no: forgot_password siempre
   devuelve el mismo mensaje, exista o no ese email en la DB. Esto evita
   que alguien use el endpoint para averiguar qué emails están registrados
   (ataque conocido como "user enumeration").
"""

# Placeholder en memoria: { token: {"email": ..., "expira_en": ...} }
# TODO: reemplazar por una tabla `password_reset_tokens` (email, token, expira_en, usado)
_reset_tokens: dict[str, dict] = {}
_RESET_TOKEN_TTL = timedelta(hours=1)  # tiempo de vida del token antes de vencer

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest):
    # TODO: Buscar el representante por email_representante en la DB.
    # Igual generamos y devolvemos el mismo mensaje si no existe, para no
    # revelar si un email está registrado (evita user enumeration).

    # Token largo y aleatorio (256 bits) generado con una fuente criptográficamente
    # segura -> es la "llave" que después va a probar que el usuario recibió el mail.
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        "email": payload.email,
        "expira_en": datetime.now(timezone.utc) + _RESET_TOKEN_TTL,
    }

    # TODO: reemplazar este print por el envío real del mail cuando exista el servicio.
    # El token nunca debe devolverse en la respuesta ni loguearse en un entorno real:
    # acá se imprime solo porque no hay servicio de mail todavía.
    print(f"[password-reset] link para {payload.email}: /reset-password?token={token}")

    return {"message": "Si el email está registrado, enviamos instrucciones para recuperar la contraseña."}

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest):
    # Buscamos el token tal cual lo mandó el cliente. Si no está en el dict
    # (nunca existió, ya se usó, o el server se reinició) o si ya venció
    # la fecha de expiración, lo tratamos como inválido.
    data = _reset_tokens.get(payload.token)
    if not data or data["expira_en"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido o expirado")

    # TODO: Hashear payload.new_password antes de guardar
    # TODO: UPDATE representates SET contrasenia_representate = :hash WHERE email_representante = :email

    # Token de un solo uso: lo borramos apenas se consume para que no
    # pueda reutilizarse para cambiar la contraseña una segunda vez.
    del _reset_tokens[payload.token]
    return {"message": "Contraseña actualizada correctamente"}

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