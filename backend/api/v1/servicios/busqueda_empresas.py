# backend/api/v1/servicios/busqueda_empresas.py
"""
Buscador de empresas con criterios combinables — módulo reutilizable.

Lo usan el dashboard admin (GET /dashboard/empresas) y la vidriera pública
(GET /landing/empresas); cualquier otro listado de empresas (por ejemplo una
exportación) puede usarlo igual. Está separado en tres piezas independientes:

1. FiltrosEmpresa + las dependencias filtros_publicos / filtros_admin:
   qué criterios acepta cada endpoint por query string.
2. armar_where(): traduce los filtros a SQL con binds. No toca la base, así
   que se puede testear sola (ver validaciones/test_busqueda_empresas.py).
3. buscar_empresas(): ejecuta la consulta, paginada o completa, y devuelve
   las filas crudas + el total. Cada endpoint elige qué columnas pide y cómo
   convierte las filas a su schema (ver convertir_filas()).

Todos los criterios son opcionales y se combinan con AND. Rubro, zona y
departamento filtran por las columnas virtuales indexadas de
db/indices_empresas.sql; el texto busca en razón social y nombre de fantasía.
"""
import logging
from dataclasses import dataclass, replace
from typing import Callable, List, Optional, Tuple, TypeVar

from fastapi import Depends, Query
from pydantic import ValidationError

from api.v1.schemas.empresas import ESTADO_PENDIENTE, ESTADO_RECHAZADA
from api.v1.servicios.paginacion import CLAUSULA_PAGINACION, Paginacion
from db_connector import execute_query

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass(frozen=True)
class FiltrosEmpresa:
    texto: Optional[str] = None
    rubro: Optional[str] = None
    zona: Optional[str] = None
    departamento: Optional[str] = None
    estado: Optional[int] = None


# --- 1. Dependencias de FastAPI ----------------------------------------


def filtros_publicos(
    texto: Optional[str] = Query(
        None, min_length=2, max_length=100, description="Busca en el nombre y la razón social (sin distinguir mayúsculas)"
    ),
    rubro: Optional[str] = Query(None, max_length=150, description="Rubro/categoría exacto (ej: AGROALIMENTO)"),
    zona: Optional[str] = Query(None, max_length=150, description="Zona exacta"),
    departamento: Optional[str] = Query(None, max_length=150, description="Departamento exacto"),
) -> FiltrosEmpresa:
    """Criterios que puede usar cualquier visitante. No incluye `estado`: el
    endpoint público lo fija él mismo (solo aprobadas)."""
    return FiltrosEmpresa(texto=texto, rubro=rubro, zona=zona, departamento=departamento)


def filtros_admin(
    filtros: FiltrosEmpresa = Depends(filtros_publicos),
    estado: Optional[int] = Query(
        None, ge=ESTADO_PENDIENTE, le=ESTADO_RECHAZADA, description="0 pendiente, 1 aprobada, 2 rechazada"
    ),
) -> FiltrosEmpresa:
    """Los criterios públicos + el estado del circuito de revisión."""
    return replace(filtros, estado=estado)


# --- 2. Filtros -> SQL -------------------------------------------------


def _patron_like(texto: str) -> str:
    """Arma el patrón de un LIKE "contiene", escapando los comodines para
    que un % o _ escrito por el usuario se busque literal."""
    escapado = texto.strip().lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escapado}%"


def armar_where(filtros: FiltrosEmpresa) -> Tuple[str, dict]:
    """Devuelve (" WHERE ...", binds) según los filtros cargados, o ("", {})
    si no hay ninguno."""
    condiciones = []
    binds: dict = {}

    if filtros.texto and filtros.texto.strip():
        condiciones.append(
            "(LOWER(razon_social) LIKE %(f_texto)s ESCAPE '\\' "
            "OR LOWER(datos_publico ->> 'nombre_empresa') LIKE %(f_texto)s ESCAPE '\\')"
        )
        binds["f_texto"] = _patron_like(filtros.texto)
    if filtros.rubro:
        condiciones.append("rubro_vc = %(f_rubro)s")
        binds["f_rubro"] = filtros.rubro
    if filtros.zona:
        condiciones.append("zona_vc = %(f_zona)s")
        binds["f_zona"] = filtros.zona
    if filtros.departamento:
        condiciones.append("departamento_vc = %(f_departamento)s")
        binds["f_departamento"] = filtros.departamento
    if filtros.estado is not None:
        condiciones.append("estado = %(f_estado)s")
        binds["f_estado"] = filtros.estado

    if not condiciones:
        return "", {}
    return " WHERE " + " AND ".join(condiciones), binds


# --- 3. Consulta -------------------------------------------------------


def buscar_empresas(
    columnas: str,
    filtros: FiltrosEmpresa,
    paginacion: Optional[Paginacion] = None,
) -> Tuple[list, int]:
    """Ejecuta la búsqueda y devuelve (filas, total).

    `columnas` es la lista de columnas del SELECT (la decide cada endpoint,
    nunca viene del usuario). Con `paginacion` trae solo esa página y `total`
    es la cantidad que cumple los filtros en todas las páginas; sin
    `paginacion` trae todo (para un mapa o una exportación).
    """
    where, binds = armar_where(filtros)
    consulta = f"SELECT {columnas} FROM empresas{where} ORDER BY id_empresa"

    if paginacion is None:
        filas = execute_query(consulta, binds, fetch=True)
        return filas, len(filas)

    total = int(execute_query(f"SELECT COUNT(*) FROM empresas{where}", binds, fetch=True)[0][0])
    filas = execute_query(consulta + CLAUSULA_PAGINACION, {**binds, **paginacion.binds()}, fetch=True)
    return filas, total


def convertir_filas(filas: list, conversor: Callable[..., T]) -> List[T]:
    """Pasa cada fila por `conversor` (fila -> schema de respuesta).

    Una empresa con el JSON incompleto (por ejemplo, cargada a mano en la
    base sin pasar por POST /dashboard/empresas) se saltea y se deja
    registro, en vez de tirar abajo todo el listado con un 500.
    """
    items = []
    for fila in filas:
        try:
            items.append(conversor(fila))
        except (KeyError, TypeError, ValidationError) as error:
            logger.warning("Empresa id=%s omitida del listado: datos incompletos (%r)", fila[0], error)
    return items
