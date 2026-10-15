# backend/api/v1/schemas/exportaciones.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# Salida: estado de una exportación encolada
# (ver api/v1/endpoints/dashboard/empresas_exportacion.py).
class ExportacionResponse(BaseModel):
    id: str
    # en_cola -> procesando -> listo | error (ver servicios/cola_trabajos.py)
    estado: str
    posicion: int  # exportaciones que tiene adelante esperando
    creado_en: datetime
    terminado_en: Optional[datetime] = None
    error: Optional[str] = None
    url_descarga: Optional[str] = None  # solo cuando estado = "listo"
