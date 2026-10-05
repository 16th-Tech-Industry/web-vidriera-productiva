from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PostulacionResponse(BaseModel):
    id_empresa: int
    id_evento: int

class PostulacionResponse(BaseModel):
    id_postulacion: int
    id_empresa: int
    id_evento: int
    fecha_postulacion: datetime
    estado: str
    motivo_rechazo: Optional[str]= None

    class Config:
        from_attrinbutes= True