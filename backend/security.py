import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict) -> str:
    expira_en = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {**data, "exp": expira_en}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


"""
Token de recuperación de contraseña — cómo funciona:

1. Es un JWT que vence en RESET_TOKEN_EXPIRE_MINUTES. No se guarda en
   ningún lado: la firma alcanza para saber que lo emitimos nosotros, así
   que sobrevive reinicios y funciona con más de una instancia.
2. Se firma con una clave derivada de JWT_SECRET_KEY, distinta a la de
   sesión: un token de sesión no sirve para cambiar la contraseña y uno de
   recuperación no sirve para entrar a la API.
3. Lleva una huella de la contraseña vigente al emitirlo. Cuando la
   contraseña cambia, la huella deja de coincidir: el token es de un solo
   uso sin necesidad de anotar cuáles ya se usaron.
"""

RESET_TOKEN_EXPIRE_MINUTES = 60


def _clave_reset() -> str:
    return hmac.new(JWT_SECRET_KEY.encode("utf-8"), b"reset-password", hashlib.sha256).hexdigest()


def _huella_password(password_hash: str) -> str:
    # HMAC y no el hash tal cual: el contenido de un JWT lo puede leer cualquiera.
    return hmac.new(_clave_reset().encode("utf-8"), password_hash.encode("utf-8"), hashlib.sha256).hexdigest()


def create_reset_token(id_representante: int, password_hash: str) -> str:
    expira_en = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(id_representante), "huella": _huella_password(password_hash), "exp": expira_en}
    return jwt.encode(payload, _clave_reset(), algorithm=JWT_ALGORITHM)


def decode_reset_token(token: str) -> dict | None:
    """Devuelve el payload del token de recuperación, o None si está vencido o no es nuestro."""
    try:
        return jwt.decode(token, _clave_reset(), algorithms=[JWT_ALGORITHM], options={"require": ["sub", "huella", "exp"]})
    except jwt.InvalidTokenError:
        return None


def reset_token_vigente(payload: dict, password_hash: str) -> bool:
    """False si la contraseña cambió después de emitir el token (ya se usó)."""
    return hmac.compare_digest(str(payload.get("huella", "")), _huella_password(password_hash))


"""
Autenticación de endpoints — cómo se usa:

1. login() (login.py) mete "rol" en el JWT (0 usuario, 1 administrador,
   ver db/bigbang.sql).
2. Un endpoint que necesita saber "quién sos" agrega
   `Depends(get_current_user)`: valida el JWT del header
   `Authorization: Bearer <token>` y devuelve su payload (sub, email, rol).
3. Un endpoint exclusivo de administrador agrega `Depends(require_admin)`
   en vez de get_current_user: además de validar el token, corta con 403
   si el rol no es de administrador.

Antes de esto ningún endpoint validaba el JWT — login() lo generaba,
pero nada lo verificaba después. Esto es lo que hace falta para que
"exclusivo de administrador" sea real y no solo un comentario.
"""

_bearer_scheme = HTTPBearer(description="Token JWT devuelto por POST /users/login")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """Valida el JWT del header Authorization y devuelve su payload (sub, email, rol)."""
    try:
        return jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def require_admin(usuario: dict = Depends(get_current_user)) -> dict:
    """Dependencia para endpoints exclusivos de administrador (rol=1)."""
    if usuario.get("rol") != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere permisos de administrador",
        )
    return usuario
