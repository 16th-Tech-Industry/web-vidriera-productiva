# backend/api/v1/schemas/notificaciones.py
from typing import List

from pydantic import BaseModel, Field

TITULO_MIN_LENGTH = 3
TITULO_MAX_LENGTH = 120
MENSAJE_MAX_LENGTH = 1000


class NotificacionBase(BaseModel):
    titulo: str = Field(..., min_length=TITULO_MIN_LENGTH, max_length=TITULO_MAX_LENGTH)
    mensaje: str = Field(..., min_length=1, max_length=MENSAJE_MAX_LENGTH)


# Entrada: notificación a todos los usuarios conectados
class NotificacionTodosRequest(NotificacionBase):
    pass


# Entrada: notificación solo a ciertos usuarios (id_representante)
class NotificacionUsuariosRequest(NotificacionBase):
    usuario_ids: List[int] = Field(..., min_length=1)


# Salida (lo que devuelve la API al admin después de enviar)
class NotificacionEnviadaResponse(BaseModel):
    # Cantidad de usuarios que la recibieron en vivo (tenían el dashboard abierto)
    usuarios_notificados: int
    # Solo para envíos a usuarios específicos: ids que no estaban conectados
    usuarios_sin_conexion: List[int] = []
