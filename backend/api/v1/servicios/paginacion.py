# backend/api/v1/servicios/paginacion.py
"""
Paginación reutilizable para cualquier listado de la API.

Uso en un endpoint:

    @router.get("/", response_model=Pagina[AlgoResponse])
    def listar(paginacion: Paginacion = Depends(parametros_paginacion)):
        filas, total = ...  # consulta con paginacion.offset / paginacion.por_pagina
        return armar_pagina(items, total, paginacion)

No depende de ninguna tabla: lo único propio de Oracle es CLAUSULA_PAGINACION,
que se concatena al final de un SELECT que ya tenga ORDER BY.
"""
from dataclasses import dataclass
from math import ceil
from typing import Generic, List, TypeVar

from fastapi import Query
from pydantic import BaseModel

POR_PAGINA_DEFAULT = 10
POR_PAGINA_MAXIMO = 100

# Va al final de la consulta, con los binds de Paginacion.binds().
CLAUSULA_PAGINACION = " OFFSET :pag_offset ROWS FETCH NEXT :pag_limite ROWS ONLY"

T = TypeVar("T")


@dataclass(frozen=True)
class Paginacion:
    pagina: int = 1
    por_pagina: int = POR_PAGINA_DEFAULT

    @property
    def offset(self) -> int:
        return (self.pagina - 1) * self.por_pagina

    def binds(self) -> dict:
        return {"pag_offset": self.offset, "pag_limite": self.por_pagina}


def parametros_paginacion(
    pagina: int = Query(1, ge=1, description="Número de página (empieza en 1)"),
    por_pagina: int = Query(
        POR_PAGINA_DEFAULT, ge=1, le=POR_PAGINA_MAXIMO, description="Cantidad de registros por página"
    ),
) -> Paginacion:
    """Dependencia de FastAPI: lee ?pagina=&por_pagina= del query string."""
    return Paginacion(pagina=pagina, por_pagina=por_pagina)


# Salida (lo que devuelve la API en un listado paginado)
class Pagina(BaseModel, Generic[T]):
    items: List[T]
    total: int  # registros que cumplen los filtros, en todas las páginas
    pagina: int
    por_pagina: int
    paginas: int  # cantidad total de páginas


def armar_pagina(items: list, total: int, paginacion: Paginacion) -> dict:
    return {
        "items": items,
        "total": total,
        "pagina": paginacion.pagina,
        "por_pagina": paginacion.por_pagina,
        "paginas": ceil(total / paginacion.por_pagina),
    }
