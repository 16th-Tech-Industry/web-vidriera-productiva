"""Imágenes subidas por los usuarios (portada de noticias y fotos de productos).

Se guardan en la base, tabla `imagenes` (db/esquema.sql): así quedan en el
mismo volumen que el resto de los datos y el backend no necesita disco
propio. El endpoint GET /api/v1/imagenes/{id} (endpoints/imagenes.py) las
sirve; quien guarda una imagen se queda con su id y arma la URL con url().

Una imagen no se modifica: reemplazarla es guardar una nueva y borrar la
vieja. Por eso el navegador puede guardarla en caché sin vencimiento.
"""
import os
from pathlib import Path
from typing import Optional, Tuple

from fastapi import HTTPException, UploadFile, status

from db_connector import execute_query

PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")

TIPOS_POR_EXTENSION = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}
TAMANIO_MAXIMO_MB = 5


def leer_subida(imagen: UploadFile) -> Tuple[bytes, str]:
    """Valida extensión y tamaño de una imagen subida. Devuelve (contenido, tipo_mime)."""
    extension = Path(imagen.filename or "").suffix.lower()
    tipo = TIPOS_POR_EXTENSION.get(extension)
    if tipo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de imagen no permitido. Usá: {', '.join(sorted(TIPOS_POR_EXTENSION))}",
        )
    contenido = imagen.file.read()
    if len(contenido) > TAMANIO_MAXIMO_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La imagen supera el tamaño máximo permitido ({TAMANIO_MAXIMO_MB} MB)",
        )
    return contenido, tipo


def guardar(contenido: bytes, tipo_mime: str) -> int:
    """Guarda la imagen y devuelve su id."""
    filas = execute_query(
        "INSERT INTO imagenes (contenido, tipo_mime) VALUES (%(contenido)s, %(tipo)s) RETURNING id_imagen",
        {"contenido": contenido, "tipo": tipo_mime},
        fetch=True,
    )
    return int(filas[0][0])


def obtener(id_imagen: int) -> Optional[Tuple[bytes, str]]:
    """(contenido, tipo_mime) de la imagen, o None si no existe."""
    filas = execute_query(
        "SELECT contenido, tipo_mime FROM imagenes WHERE id_imagen = %(id)s",
        {"id": id_imagen},
        fetch=True,
    )
    if not filas:
        return None
    contenido, tipo = filas[0]
    return bytes(contenido), tipo


def borrar(id_imagen: Optional[int]) -> None:
    """Borra la imagen. No hace nada si el id es None o ya no existe."""
    if id_imagen is None:
        return
    execute_query("DELETE FROM imagenes WHERE id_imagen = %(id)s", {"id": int(id_imagen)})


def url(id_imagen: Optional[int]) -> Optional[str]:
    """URL lista para usar en un <img>, o None si no hay imagen."""
    if id_imagen is None:
        return None
    return f"{PUBLIC_BASE_URL}/api/v1/imagenes/{int(id_imagen)}"
