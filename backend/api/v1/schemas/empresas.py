# backend/api/v1/schemas/empresas.py
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

# Forma del JSON que se persiste en empresas.datos_publico (columna JSON
# nativa de Oracle, ver db/bigbang.sql). Espeja exactamente el ejemplo de
# db/empresas.json: cuit y razon_social son columnas propias de la tabla,
# el resto vive adentro del JSON.

# Estados del circuito de revisión (ver db/empresas_revision.sql):
# el usuario carga la empresa (nace pendiente) y un admin la aprueba o
# rechaza desde su dashboard.
ESTADO_PENDIENTE = 0
ESTADO_APROBADA = 1
ESTADO_RECHAZADA = 2


class UbicacionEmpresa(BaseModel):
    zona: str = Field(..., min_length=1, max_length=150)
    departamento: str = Field(..., min_length=1, max_length=150)
    localidad: str = Field(..., min_length=1, max_length=150)
    calle: str = Field(..., min_length=1, max_length=200)
    numero: int = Field(..., ge=0)
    latitud: float = Field(..., ge=-90, le=90)
    longitud: float = Field(..., ge=-180, le=180)


class RedesEmpresa(BaseModel):
    numero_contacto: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    pagina_web: Optional[str] = None


# Entrada (lo que manda el dashboard usuario al dar de alta su empresa)
class EmpresaCreate(BaseModel):
    cuit: int = Field(..., ge=10_000_000_000, le=99_999_999_999, description="CUIT sin guiones (11 dígitos)")
    razon_social: str = Field(..., min_length=1, max_length=255)
    nombre_empresa: str = Field(..., min_length=1, max_length=200)
    rubro: str = Field(..., min_length=1, max_length=150)
    ubicacion: UbicacionEmpresa
    descripcion: str = Field(..., min_length=1)
    correo_empresa: EmailStr
    redes: RedesEmpresa = RedesEmpresa()


# Salida (lo que devuelve la API)
class EmpresaResponse(BaseModel):
    id_empresa: int
    cuit: int
    razon_social: str
    nombre_empresa: str
    rubro: str
    ubicacion: UbicacionEmpresa
    descripcion: str
    correo_empresa: EmailStr
    redes: RedesEmpresa
    id_representante: int
    estado: int
    motivo_rechazo: Optional[str] = None

    class Config:
        from_attributes = True


# Entrada del admin al rechazar una empresa (dashboard admin)
class RechazoEmpresaRequest(BaseModel):
    motivo_rechazo: str = Field(..., min_length=1, max_length=500)


# Salida pública (landing/vidriera): solo empresas con estado = ESTADO_APROBADA.
# A diferencia de EmpresaResponse, no expone estado/motivo_rechazo/id_representante
# ni cuit — son datos del circuito de revisión interno, no de cara al visitante.
class EmpresaPublicaResponse(BaseModel):
    id_empresa: int
    razon_social: str
    nombre_empresa: str
    rubro: str
    ubicacion: UbicacionEmpresa
    descripcion: str
    correo_empresa: EmailStr
    redes: RedesEmpresa

    class Config:
        from_attributes = True
