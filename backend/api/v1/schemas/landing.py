# backend/api/v1/schemas/landing.py
from typing import List, Optional

from pydantic import BaseModel, Field

# Esquemas de la landing (vista pública "mapa" en el frontend: Mapa +
# Calendario). Mantienen la forma que ya consumía el frontend; los datos
# salen de las empresas aprobadas y de la tabla eventos (ver
# api/v1/endpoints/landing.py).


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
    # La tabla eventos todavía no guarda coordenadas: null = no va al mapa
    lat: Optional[float] = None
    lng: Optional[float] = None
    descripcion: str
    imagen: str

    class Config:
        from_attributes = True


class LandingResponse(BaseModel):
    productores: List[ProductorResponse]
    eventos: List[EventoResponse]
