from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from api.v1.schemas.users import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
    LoginRequest,
    TokenResponse,
)
from db_connector import execute_query
from api.v1.servicios.correo import enviar_recupero_contrasena
from security import (
    verify_password,
    create_access_token,
    hash_password,
    create_reset_token,
    decode_reset_token,
    reset_token_vigente,
)

router = APIRouter(prefix="/users", tags=["Login"])

# NOTA: el registro (create_user) vive en register.py y el CRUD de usuarios
# en endpoints/user.py. Este archivo es exclusivo de login y recuperación
# de contraseña.

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Valida email + password contra `representates` y devuelve un JWT de sesión."""
    rows = execute_query(
        "SELECT id_representante, nombre_representante, contrasenia_representate, estado, rol "
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

    id_representante, nombre, password_hash, estado, rol = rows[0]

    if not verify_password(payload.password, password_hash):
        raise credenciales_invalidas

    if estado != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta inactiva")

    # int(rol): NUMBER(1) puede volver como Decimal, y eso no serializa a JSON
    # dentro del JWT. "rol" es lo que después chequea security.require_admin().
    token = create_access_token({"sub": str(id_representante), "email": payload.email, "rol": int(rol)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": id_representante,
            "name": nombre,
            "email": payload.email,
            "role": int(rol)
        }
    }

"""
Recuperación de contraseña — cómo funciona:

1. El usuario pide recuperar su clave (forgot_password) mandando solo su email.
2. Si el email es de una cuenta activa, generamos un token firmado que vence
   en 1 hora (security.create_reset_token) y se lo mandamos por mail con un
   link al frontend. El token no se guarda en ningún lado ni se devuelve en
   la respuesta: la única forma de tenerlo es leer ese mail.
3. El mail sale en segundo plano (BackgroundTasks), después de responder: el
   endpoint tarda lo mismo exista o no el email y no depende de que el
   servidor de correo conteste.
4. El usuario manda ese token + su nueva contraseña (reset_password). Si la
   firma es válida, no venció y la contraseña no cambió desde que se emitió,
   se actualiza. Con ese cambio el token deja de servir (es de un solo uso).
5. Nunca confirmamos si el email existe o no: forgot_password siempre
   devuelve el mismo mensaje, exista o no ese email en la DB. Esto evita
   que alguien use el endpoint para averiguar qué emails están registrados
   (ataque conocido como "user enumeration").
"""

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Manda por mail un token de recuperación de un solo uso, si el email es de una cuenta activa."""
    rows = execute_query(
        "SELECT id_representante, nombre_representante, contrasenia_representate, estado "
        "FROM representates WHERE email_representante = :email",
        {"email": payload.email},
        fetch=True,
    )

    if rows and rows[0][3] == 1:
        id_representante, nombre, password_hash, _ = rows[0]
        token = create_reset_token(id_representante, password_hash)
        background_tasks.add_task(enviar_recupero_contrasena, payload.email, nombre, token)

    return {"message": "Si el email está registrado, enviamos instrucciones para recuperar la contraseña."}

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest):
    """Valida el token de recuperación y actualiza la password hasheada del representante."""
    # Mismo error para token mal firmado, vencido o ya usado: no le damos
    # pistas a quien esté probando tokens.
    token_invalido = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido o expirado")

    datos = decode_reset_token(payload.token)
    if not datos or not datos["sub"].isdigit():
        raise token_invalido
    id_representante = int(datos["sub"])

    rows = execute_query(
        "SELECT contrasenia_representate FROM representates WHERE id_representante = :id",
        {"id": id_representante},
        fetch=True,
    )
    if not rows or not reset_token_vigente(datos, rows[0][0]):
        raise token_invalido

    execute_query(
        "UPDATE representates SET contrasenia_representate = :password_hash "
        "WHERE id_representante = :id",
        {
            "password_hash": hash_password(payload.new_password),
            "id": id_representante,
        },
    )
    return {"message": "Contraseña actualizada correctamente"}
