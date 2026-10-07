import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from api.v1.schemas.noticias import (
    CUERPO_MIN_LENGTH,
    NoticiaResponse,
    TITULO_MAX_LENGTH,
    TITULO_MIN_LENGTH,
)
from db_connector import execute_query
from security import require_admin

router = APIRouter(prefix="/noticias", tags=["Noticias"])

# --- Almacenamiento de imágenes ---------------------------------------
#
# La imagen se guarda en disco (backend/uploads/noticias/), no como BLOB
# en Oracle: en la tabla `noticias` (db/noticias.sql) solo se persiste el
# nombre de archivo. `main.py` sirve esa carpeta como estático en /uploads,
# así que la URL pública de una imagen queda
# "{PUBLIC_BASE_URL}/uploads/noticias/<archivo>".
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
TAMANIO_MAXIMO_MB = 5

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOADS_DIR = BACKEND_DIR / "uploads" / "noticias"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _guardar_imagen(imagen: UploadFile) -> str:
    """Valida extensión y tamaño, guarda el archivo y devuelve su nombre generado."""
    extension = Path(imagen.filename or "").suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de imagen no permitido. Usá: {', '.join(sorted(EXTENSIONES_PERMITIDAS))}",
        )

    contenido = imagen.file.read()
    if len(contenido) > TAMANIO_MAXIMO_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La imagen supera el tamaño máximo permitido ({TAMANIO_MAXIMO_MB} MB)",
        )

    # Nombre random: evita colisiones y que alguien pise el archivo de otro
    # con el mismo nombre original.
    nombre_archivo = f"{uuid.uuid4().hex}{extension}"
    (UPLOADS_DIR / nombre_archivo).write_bytes(contenido)
    return nombre_archivo


def _eliminar_imagen(nombre_archivo: Optional[str]) -> None:
    """Borra del disco la imagen anterior de una noticia (al editarla o eliminarla)."""
    if not nombre_archivo:
        return
    (UPLOADS_DIR / nombre_archivo).unlink(missing_ok=True)


def _armar_imagen_url(nombre_archivo: Optional[str]) -> Optional[str]:
    if not nombre_archivo:
        return None
    return f"{PUBLIC_BASE_URL}/uploads/noticias/{nombre_archivo}"


def _fila_a_response(fila) -> NoticiaResponse:
    id_noticia, titulo, cuerpo, imagen_archivo, fecha_creacion, estado = fila
    cuerpo = cuerpo.read() if hasattr(cuerpo, "read") else str(cuerpo)
    return NoticiaResponse(
        id=id_noticia,
        titulo=titulo,
        cuerpo=cuerpo,
        imagen_url=_armar_imagen_url(imagen_archivo),
        fecha_creacion=fecha_creacion,
        estado=int(estado),
    )


_SELECT_NOTICIA = (
    "SELECT id_noticia, titulo, cuerpo, imagen_archivo, fecha_creacion, estado FROM noticias"
)


@router.get("/", response_model=List[NoticiaResponse])
def listar_noticias(solo_activas: bool = True):
    """Listado público de noticias (lo consume la sección de Novedades)."""
    query = _SELECT_NOTICIA + (" WHERE estado = 1" if solo_activas else "") + " ORDER BY fecha_creacion DESC"
    filas = execute_query(query, fetch=True)
    return [_fila_a_response(fila) for fila in filas]


@router.get("/{noticia_id}", response_model=NoticiaResponse)
def obtener_noticia(noticia_id: int):
    filas = execute_query(
        _SELECT_NOTICIA + " WHERE id_noticia = :id",
        {"id": noticia_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no encontrada")
    return _fila_a_response(filas[0])


@router.post("/", response_model=NoticiaResponse, status_code=status.HTTP_201_CREATED)
def crear_noticia(
    titulo: str = Form(..., min_length=TITULO_MIN_LENGTH, max_length=TITULO_MAX_LENGTH),
    cuerpo: str = Form(..., min_length=CUERPO_MIN_LENGTH),
    imagen: Optional[UploadFile] = File(None, description="Imagen de la noticia (opcional)"),
    admin: dict = Depends(require_admin),
):
    """Crea una noticia. Exclusivo de administradores (ver security.require_admin)."""
    nombre_archivo = _guardar_imagen(imagen) if imagen is not None else None

    execute_query(
        "INSERT INTO noticias (titulo, cuerpo, imagen_archivo, fecha_creacion, id_representante_autor, estado) "
        "VALUES (:titulo, :cuerpo, :imagen, :fecha, :autor, 1)",
        {
            "titulo": titulo,
            "cuerpo": cuerpo,
            "imagen": nombre_archivo,
            "fecha": datetime.now(),
            "autor": int(admin["sub"]),
        },
    )

    # Mismo patrón que register.py: como execute_query no expone el id
    # generado, se busca de nuevo la fila recién insertada. No es 100%
    # atómico ante dos altas con el mismo título en el mismo instante,
    # pero es un panel de administración de bajo volumen, no un alta pública.
    nueva = execute_query(
        _SELECT_NOTICIA + " WHERE titulo = :titulo ORDER BY id_noticia DESC FETCH FIRST 1 ROW ONLY",
        {"titulo": titulo},
        fetch=True,
    )
    return _fila_a_response(nueva[0])


@router.patch("/{noticia_id}", response_model=NoticiaResponse)
def editar_noticia(
    noticia_id: int,
    titulo: Optional[str] = Form(None, min_length=TITULO_MIN_LENGTH, max_length=TITULO_MAX_LENGTH),
    cuerpo: Optional[str] = Form(None, min_length=CUERPO_MIN_LENGTH),
    imagen: Optional[UploadFile] = File(None, description="Nueva imagen (opcional, reemplaza la anterior)"),
    admin: dict = Depends(require_admin),
):
    """Edita título, cuerpo y/o imagen de una noticia. Exclusivo de administradores."""
    filas = execute_query(
        _SELECT_NOTICIA + " WHERE id_noticia = :id",
        {"id": noticia_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no encontrada")

    _, titulo_actual, cuerpo_actual, imagen_actual, _, _ = filas[0]

    nuevo_titulo = titulo if titulo is not None else titulo_actual
    nuevo_cuerpo = cuerpo if cuerpo is not None else cuerpo_actual
    nueva_imagen = imagen_actual

    if imagen is not None:
        nueva_imagen = _guardar_imagen(imagen)
        _eliminar_imagen(imagen_actual)  # la vieja ya no se usa, no dejarla huérfana en disco

    execute_query(
        "UPDATE noticias SET titulo = :titulo, cuerpo = :cuerpo, imagen_archivo = :imagen, "
        "fecha_actualizacion = :fecha WHERE id_noticia = :id",
        {
            "titulo": nuevo_titulo,
            "cuerpo": nuevo_cuerpo,
            "imagen": nueva_imagen,
            "fecha": datetime.now(),
            "id": noticia_id,
        },
    )

    actualizada = execute_query(
        _SELECT_NOTICIA + " WHERE id_noticia = :id",
        {"id": noticia_id},
        fetch=True,
    )
    return _fila_a_response(actualizada[0])


@router.delete("/{noticia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_noticia(noticia_id: int, admin: dict = Depends(require_admin)):
    """Elimina una noticia y su imagen en disco. Exclusivo de administradores."""
    filas = execute_query(
        "SELECT imagen_archivo FROM noticias WHERE id_noticia = :id",
        {"id": noticia_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no encontrada")

    _eliminar_imagen(filas[0][0])
    execute_query("DELETE FROM noticias WHERE id_noticia = :id", {"id": noticia_id})
    return None
