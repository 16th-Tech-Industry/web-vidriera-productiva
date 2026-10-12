import json
from dataclasses import replace
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from api.v1.schemas.empresas import ESTADO_APROBADA, EmpresaPublicaDetalleResponse, EmpresaPublicaResponse
from api.v1.schemas.landing import EventoResponse, LandingResponse, ProductorResponse
from api.v1.servicios.busqueda_empresas import (
    FiltrosEmpresa,
    buscar_empresas,
    convertir_filas,
    filtros_publicos,
)
from api.v1.servicios.productos_empresa import listar_productos
from db_connector import execute_query

router = APIRouter(prefix="/landing", tags=["Landing"])

"""
Datos hardcodeados para la vista pública "mapa" (Mapa + Calendario en el
frontend). Igual que users.py, es un mock: no hay tabla `productores` ni
`eventos` en Oracle todavía, así que se devuelve un diccionario fijo en
vez de pegarle a la DB. Sirve para que el frontend deje de leer
frontend/src/assets/db.json y empiece a consumir la API, sin bloquearse
en el modelado definitivo de esas tablas.
"""

_PRODUCTORES = [
    {
        "id": 1,
        "nombre": "AgroTech Córdoba",
        "rubro": "AGTECH",
        "localidad": "Río Cuarto",
        "lat": -33.1232,
        "lng": -64.3492,
        "descripcion": "Maquinaria de precisión.",
        "imagen": "src/assets/Agrotech.jpg",
    },
    {
        "id": 2,
        "nombre": "Sabores Serranos",
        "rubro": "AGROALIMENTO",
        "localidad": "Villa General Belgrano",
        "lat": -31.9774,
        "lng": -64.5559,
        "descripcion": "Dulces artesanales.",
        "imagen": "src/assets/SaboresSerranos.png",
    },
]

_EVENTOS = [
    {
        "id": 1,
        "nombre": "Exposición Rural de Río Cuarto",
        "categoria": "AGROINDUSTRIA",
        "localidad": "Río Cuarto",
        "fechaInicio": "2026-09-02",
        "fechaFin": "2026-09-06",
        "lat": -33.1245,
        "lng": -64.3521,
        "descripcion": "Muestra comercial, industrial y de servicios ganaderos.",
        "imagen": "src/assets/RuralRIO4.png",
    },
    {
        "id": 2,
        "nombre": "Fiesta Nacional de la Cerveza (Oktoberfest)",
        "categoria": "AGROALIMENTO",
        "localidad": "Villa General Belgrano",
        "fechaInicio": "2026-10-02",
        "fechaFin": "2026-10-12",
        "lat": -31.9768,
        "lng": -64.5562,
        "descripcion": "Tradicional celebración con productores gastronómicos y cerveceros.",
        "imagen": "src/assets/OktoberFest.png",
    },
    {
        "id": 3,
        "nombre": "Congreso Internacional AgTech Córdoba",
        "categoria": "AGTECH",
        "localidad": "Córdoba Capital",
        "fechaInicio": "2026-11-15",
        "fechaFin": "2026-11-17",
        "lat": -31.4201,
        "lng": -64.1888,
        "descripcion": "Encuentro de innovación y tecnologías aplicadas al agro.",
        "imagen": "src/assets/AgtechCBA.png",
    },
]


@router.get("/", response_model=LandingResponse)
def obtener_landing():
    """Productores y eventos que muestran el Mapa y el Calendario de la landing."""
    return {"productores": _PRODUCTORES, "eventos": _EVENTOS}


@router.get("/productores", response_model=list[ProductorResponse])
def listar_productores():
    return _PRODUCTORES


@router.get("/eventos", response_model=list[EventoResponse])
def listar_eventos():
    return _EVENTOS


# --- Empresas reales (tabla `empresas`), a diferencia de _PRODUCTORES/_EVENTOS
# que siguen siendo mock. Solo se muestran las aprobadas por un admin (ver
# dashboard/empresas_revision.py). Los filtros y la consulta salen del
# buscador compartido (api/v1/servicios/busqueda_empresas.py), el mismo que
# usa el dashboard admin.


def _fila_a_empresa_publica(fila) -> EmpresaPublicaResponse:
    id_empresa, razon_social, datos_publico = fila
    datos = datos_publico if isinstance(datos_publico, dict) else json.loads(datos_publico)
    return EmpresaPublicaResponse(
        id_empresa=id_empresa,
        razon_social=razon_social,
        nombre_empresa=datos["nombre_empresa"],
        rubro=datos["rubro"],
        ubicacion=datos["ubicacion"],
        descripcion=datos["descripcion"],
        correo_empresa=datos["correo_empresa"],
        redes=datos.get("redes", {}),
    )


@router.get("/empresas/{empresa_id}", response_model=EmpresaPublicaDetalleResponse)
def obtener_empresa_publica(empresa_id: int):
    """Ficha pública de una empresa aprobada, con sus productos. Es una sola
    lectura por clave primaria: los productos viven en el mismo JSON que la
    empresa (ver api/v1/servicios/productos_empresa.py)."""
    filas = execute_query(
        "SELECT id_empresa, razon_social, datos_publico FROM empresas "
        "WHERE id_empresa = :id AND estado = :estado",
        {"id": empresa_id, "estado": ESTADO_APROBADA},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    datos = filas[0][2] if isinstance(filas[0][2], dict) else json.loads(filas[0][2])
    publica = _fila_a_empresa_publica(filas[0])
    return EmpresaPublicaDetalleResponse(**publica.model_dump(), productos=listar_productos(datos))


@router.get("/empresas", response_model=List[EmpresaPublicaResponse])
def listar_empresas_publicas(filtros: FiltrosEmpresa = Depends(filtros_publicos)):
    """Empresas aprobadas para la vidriera pública (mapa de la landing), opcionalmente
    filtradas por texto, rubro, zona y/o departamento. Devuelve todas las que
    cumplen (sin paginar): el mapa necesita todos los puntos."""
    filas, _ = buscar_empresas(
        "id_empresa, razon_social, datos_publico",
        replace(filtros, estado=ESTADO_APROBADA),
    )
    return convertir_filas(filas, _fila_a_empresa_publica)
