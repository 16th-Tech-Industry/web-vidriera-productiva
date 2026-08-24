import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from api.v1.schemas.users import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
    LoginRequest,
    TokenResponse,
)
from db_connector import execute_query
from security import verify_password, create_access_token, hash_password

router = APIRouter(prefix="/users", tags=["Login"])

# NOTA: el registro (create_user) vive en register.py y el CRUD de usuarios
# en endpoints/user.py. Este archivo es exclusivo de login y recuperación
# de contraseña.

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Valida email + password contra `representates` y devuelve un JWT de sesión."""
    rows = execute_query(
        "SELECT id_representante, contrasenia_representate, estado "
        "FROM representates WHERE email_representante = :email",
        {"email": payload.email},
        fetch=True,
    )

    # Mismo error para email inexistente o contraseña incorrecta:
    # evita que alguien use el endpoint para averiguar qué emails
    # están registrados (user enumeration).
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos",
    )

    if not rows:
        raise credenciales_invalidas

    id_representante, password_hash, estado = rows[0]

    if not verify_password(payload.password, password_hash):
        raise credenciales_invalidas

    if estado != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta inactiva")

    token = create_access_token({"sub": str(id_representante), "email": payload.email})
    return {"access_token": token, "token_type": "bearer"}

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
    """Genera un token de recuperación de un solo uso y lo entrega (hoy por consola, simulando el mail)."""
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
    """Valida el token de recuperación y actualiza la password hasheada del representante."""
    # Buscamos el token tal cual lo mandó el cliente. Si no está en el dict
    # (nunca existió, ya se usó, o el server se reinició) o si ya venció
    # la fecha de expiración, lo tratamos como inválido.
    data = _reset_tokens.get(payload.token)
    if not data or data["expira_en"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido o expirado")

    execute_query(
        "UPDATE representates SET contrasenia_representate = :password_hash "
        "WHERE email_representante = :email",
        {
            "password_hash": hash_password(payload.new_password),
            "email": data["email"],
        },
    )

    # Token de un solo uso: lo borramos apenas se consume para que no
    # pueda reutilizarse para cambiar la contraseña una segunda vez.
    del _reset_tokens[payload.token]
    return {"message": "Contraseña actualizada correctamente"}
