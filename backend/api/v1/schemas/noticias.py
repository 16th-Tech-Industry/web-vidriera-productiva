# backend/api/v1/schemas/noticias.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# Límites de validación de título/cuerpo. Viven acá como constantes (y no
# repetidas como "números mágicos") porque el endpoint de creación/edición
# (api/v1/endpoints/noticias.py) es multipart/form-data (título + cuerpo +
# imagen), así que no puede recibir el body como JSON/Pydantic normal: usa
# estas mismas constantes directo en los Form(..., min_length=..., ...).
#
# NoticiaBase documenta esas reglas y permite testearlas sin necesitar
# server ni multipart (ver validaciones/test_esquemas_noticias.py).
TITULO_MIN_LENGTH = 3
TITULO_MAX_LENGTH = 200
CUERPO_MIN_LENGTH = 10


class NoticiaBase(BaseModel):
    titulo: str = Field(..., min_length=TITULO_MIN_LENGTH, max_length=TITULO_MAX_LENGTH)
    cuerpo: str = Field(..., min_length=CUERPO_MIN_LENGTH)


# Salida (lo que devuelve la API)
class NoticiaResponse(NoticiaBase):
    id: int
    imagen_url: Optional[str] = None
    fecha_creacion: datetime
    estado: int

    class Config:
        from_attributes = True
