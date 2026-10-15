from fastapi import APIRouter, HTTPException, Response, status

from api.v1.servicios import imagenes

router = APIRouter(prefix="/imagenes", tags=["Imágenes"])


@router.get("/{id_imagen}")
def obtener_imagen(id_imagen: int):
    """Imagen guardada en la base (portada de noticia o foto de producto). Pública."""
    imagen = imagenes.obtener(id_imagen)
    if imagen is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imagen no encontrada")
    contenido, tipo = imagen
    # Una imagen nunca cambia (reemplazarla crea otra con otro id), así que el
    # navegador la puede guardar en caché sin volver a pedirla.
    return Response(
        content=contenido,
        media_type=tipo,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
