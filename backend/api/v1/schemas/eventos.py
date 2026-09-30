from pydantic import BaseModel
from typing import Optional

class EventoBase(BaseModel):
    fecha: str
    titulo: str
    descripcion: str
    hora: str
    lugar: str
    color: str= "blue"

class EventoCreate(EventoBase):
    pass

class EventoUpdate(EventoBase):
    pass

class EventoResponse(EventoBase):
    id: str

    class Config:
        from_attributes= True