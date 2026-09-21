# backend/api/v1/schemas/landing.py
from typing import List

from pydantic import BaseModel, Field

# Esquemas de la landing (vista pública "mapa" en el frontend: Mapa +
# Calendario). Por ahora no tienen tabla propia en Oracle, así que el
# endpoint (api/v1/endpoints/landing.py) devuelve datos hardcodeados con
# la misma forma que hoy consume el frontend desde
# frontend/src/assets/db.json, para poder migrar ese mock a la API sin
# tocar los componentes.


class ProductorResponse(BaseModel):
    id: int
    nombre: str = Field(..., min_length=1, max_length=200)
    rubro: str
    localidad: str
    lat: float
    lng: float
    descripcion: str
    imagen: str

    class Config:
        from_attributes = True


class EventoResponse(BaseModel):
    id: int
    nombre: str = Field(..., min_length=1, max_length=200)
    categoria: str
    localidad: str
    fechaInicio: str
    fechaFin: str
    lat: float
    lng: float
    descripcion: str
    imagen: str

    class Config:
        from_attributes = True


class LandingResponse(BaseModel):
    productores: List[ProductorResponse]
    eventos: List[EventoResponse]
