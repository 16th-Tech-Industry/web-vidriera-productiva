from pydantic import BaseModel
from typing import Optional

class EventoBase(BaseModel):
    fecha: str
    titulo: str
    descripcion: str
    hora: str
    lugar: str
    color: str

class EventoCreate(EventoBase):
    pass

class EventoUpdate(EventoBase):
    pass

class EventoResponse(EventoBase):
    id: str
    # /uploads/eventos/<archivo>, o None si el evento no tiene imagen.
    # Todavía no se carga desde el formulario de creación (se agrega más adelante).
    imagen_url: Optional[str] = None

    class Config:
        from_attributes= True