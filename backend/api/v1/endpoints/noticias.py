from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from api.v1.schemas.noticias import (
    CUERPO_MIN_LENGTH,
    NoticiaResponse,
    TITULO_MAX_LENGTH,
    TITULO_MIN_LENGTH,
)
from api.v1.servicios import imagenes
from db_connector import execute_query
from security import require_admin

router = APIRouter(prefix="/noticias", tags=["Noticias"])

# La imagen de portada se guarda en la base (tabla imagenes, ver
# api/v1/servicios/imagenes.py); la noticia guarda su id.


def _fila_a_response(fila) -> NoticiaResponse:
    id_noticia, titulo, cuerpo, id_imagen, fecha_creacion, estado = fila
    return NoticiaResponse(
        id=id_noticia,
        titulo=titulo,
        cuerpo=cuerpo,
        imagen_url=imagenes.url(id_imagen),
        fecha_creacion=fecha_creacion,
        estado=int(estado),
    )


_SELECT_NOTICIA = (
    "SELECT id_noticia, titulo, cuerpo, id_imagen, fecha_creacion, estado FROM noticias"
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
        _SELECT_NOTICIA + " WHERE id_noticia = %(id)s",
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
    id_imagen = imagenes.guardar(*imagenes.leer_subida(imagen)) if imagen is not None else None

    try:
        execute_query(
            "INSERT INTO noticias (titulo, cuerpo, id_imagen, fecha_creacion, id_representante_autor, estado) "
            "VALUES (%(titulo)s, %(cuerpo)s, %(imagen)s, %(fecha)s, %(autor)s, 1)",
            {
                "titulo": titulo,
                "cuerpo": cuerpo,
                "imagen": id_imagen,
                "fecha": datetime.now(),
                "autor": int(admin["sub"]),
            },
        )
    except Exception:
        imagenes.borrar(id_imagen)  # que no quede una imagen sin noticia
        raise

    # Mismo patrón que register.py: como execute_query no expone el id
    # generado, se busca de nuevo la fila recién insertada. No es 100%
    # atómico ante dos altas con el mismo título en el mismo instante,
    # pero es un panel de administración de bajo volumen, no un alta pública.
    nueva = execute_query(
        _SELECT_NOTICIA + " WHERE titulo = %(titulo)s ORDER BY id_noticia DESC FETCH FIRST 1 ROW ONLY",
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
        _SELECT_NOTICIA + " WHERE id_noticia = %(id)s",
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
        nueva_imagen = imagenes.guardar(*imagenes.leer_subida(imagen))

    execute_query(
        "UPDATE noticias SET titulo = %(titulo)s, cuerpo = %(cuerpo)s, id_imagen = %(imagen)s, "
        "fecha_actualizacion = %(fecha)s WHERE id_noticia = %(id)s",
        {
            "titulo": nuevo_titulo,
            "cuerpo": nuevo_cuerpo,
            "imagen": nueva_imagen,
            "fecha": datetime.now(),
            "id": noticia_id,
        },
    )
    # La vieja se borra recién cuando la noticia ya apunta a la nueva.
    if imagen is not None:
        imagenes.borrar(imagen_actual)

    actualizada = execute_query(
        _SELECT_NOTICIA + " WHERE id_noticia = %(id)s",
        {"id": noticia_id},
        fetch=True,
    )
    return _fila_a_response(actualizada[0])


@router.delete("/{noticia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_noticia(noticia_id: int, admin: dict = Depends(require_admin)):
    """Elimina una noticia y su imagen. Exclusivo de administradores."""
    filas = execute_query(
        "SELECT id_imagen FROM noticias WHERE id_noticia = %(id)s",
        {"id": noticia_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no encontrada")

    execute_query("DELETE FROM noticias WHERE id_noticia = %(id)s", {"id": noticia_id})
    imagenes.borrar(filas[0][0])
    return None
