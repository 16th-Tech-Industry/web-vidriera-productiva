import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from api.v1.schemas.empresas import EmpresaPublicaDetalleResponse, EmpresaPublicaResponse
from api.v1.schemas.landing import EventoResponse, LandingResponse, ProductorResponse
from api.v1.endpoints.eventos import listar_eventos
from api.v1.servicios import vidriera_json
from api.v1.servicios.busqueda_empresas import FiltrosEmpresa, convertir_filas, filtros_publicos
from api.v1.servicios.productos_empresa import listar_productos

router = APIRouter(prefix="/landing", tags=["Landing"])

"""
Vista pública "mapa" (Mapa + Calendario en el frontend). Antes devolvía
productores y eventos fijos en este archivo; ahora salen de la base:

- productores: las empresas aprobadas, leídas del archivo JSON de la
  vidriera (ver api/v1/servicios/vidriera_json.py), con la forma que ya
  consume el frontend (lat/lng en vez de ubicacion.latitud/longitud).
- eventos: la tabla `eventos` (ver endpoints/eventos.py). Esa tabla todavía
  no tiene coordenadas ni categoría: lat/lng van en null (el mapa no los
  dibuja, el calendario sí los muestra) y la categoría vacía.
"""


def _empresa_a_productor(empresa: EmpresaPublicaResponse, datos_publico) -> dict:
    # Imagen de la tarjeta del mapa: la del primer producto que tenga foto.
    imagen = next((p.imagen_url for p in listar_productos(datos_publico) if p.imagen_url), None)
    return {
        "id": empresa.id_empresa,
        "nombre": empresa.nombre_empresa,
        "rubro": empresa.rubro,
        "localidad": empresa.ubicacion.localidad,
        "lat": empresa.ubicacion.latitud,
        "lng": empresa.ubicacion.longitud,
        "descripcion": empresa.descripcion,
        "imagen": imagen or "",
    }


def _productores() -> list[dict]:
    productores = []
    for fila in vidriera_json.empresas_publicas():
        publica = convertir_filas([fila], _fila_a_empresa_publica)
        if publica:  # las incompletas se saltean (convertir_filas ya avisa por consola)
            productores.append(_empresa_a_productor(publica[0], fila[2]))
    return productores


def _eventos() -> list[dict]:
    return [
        {
            "id": int(evento.id),
            "nombre": evento.titulo,
            "categoria": "",
            "localidad": evento.lugar,
            "fechaInicio": evento.fecha,
            "fechaFin": evento.fecha,
            "lat": None,
            "lng": None,
            "descripcion": evento.descripcion,
            "imagen": "",
        }
        for evento in listar_eventos()
    ]


@router.get("/", response_model=LandingResponse)
def obtener_landing():
    """Productores (empresas aprobadas) y eventos que muestran el Mapa y el Calendario de la landing."""
    return {"productores": _productores(), "eventos": _eventos()}


@router.get("/productores", response_model=list[ProductorResponse])
def listar_productores():
    return _productores()


@router.get("/eventos", response_model=list[EventoResponse])
def listar_eventos_landing():
    return _eventos()


# --- Empresas reales (tabla `empresas`), a diferencia de _PRODUCTORES/_EVENTOS
# que siguen siendo mock. Solo se muestran las aprobadas por un admin (ver
# dashboard/empresas_revision.py). Se leen del archivo JSON de la vidriera
# (api/v1/servicios/vidriera_json.py), que se regenera desde Oracle cuando
# cambia una empresa aprobada; los filtros aceptados son los mismos del
# buscador del dashboard admin (api/v1/servicios/busqueda_empresas.py).


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
    """Ficha pública de una empresa aprobada, con sus productos. Sale del
    archivo JSON de la vidriera (ver api/v1/servicios/vidriera_json.py), sin
    consultar Oracle."""
    fila = vidriera_json.empresa_publica(empresa_id)
    if fila is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    try:
        publica = _fila_a_empresa_publica(fila)
    except (KeyError, TypeError, ValidationError):
        # Empresa cargada a mano con el JSON incompleto: el listado la saltea
        # (ver convertir_filas) y la ficha no existe, en vez de un 500.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return EmpresaPublicaDetalleResponse(**publica.model_dump(), productos=listar_productos(fila[2]))


@router.get("/empresas", response_model=List[EmpresaPublicaResponse])
def listar_empresas_publicas(filtros: FiltrosEmpresa = Depends(filtros_publicos)):
    """Empresas aprobadas para la vidriera pública (mapa de la landing), opcionalmente
    filtradas por texto, rubro, zona y/o departamento. Devuelve todas las que
    cumplen (sin paginar): el mapa necesita todos los puntos. Sale del archivo
    JSON de la vidriera, sin consultar Oracle."""
    return convertir_filas(vidriera_json.empresas_publicas(filtros), _fila_a_empresa_publica)
