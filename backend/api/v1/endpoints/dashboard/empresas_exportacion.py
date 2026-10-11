from dataclasses import asdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status

from api.v1.schemas.exportaciones import ExportacionResponse
from api.v1.servicios.busqueda_empresas import FiltrosEmpresa, filtros_admin
from api.v1.servicios.cola_trabajos import ColaLlena, ColaTrabajos, EstadoTrabajo, Trabajo
from api.v1.servicios.exportacion_empresas import MEDIA_TYPE_XLSX, generar_xlsx_empresas
from security import require_admin

router = APIRouter(prefix="/dashboard/empresas/exportaciones", tags=["Dashboard - Empresas (admin)"])

"""
Exportación de empresas a Excel — cómo funciona:

El archivo no se genera dentro del request: se encola (ver
api/v1/servicios/cola_trabajos.py) para que varias exportaciones juntas no
compitan con el resto de la API. El dashboard admin hace tres pasos:

1. POST /dashboard/empresas/exportaciones/?<filtros>
   Mismos filtros que el buscador (GET /dashboard/empresas/). Responde al
   instante 202 con el id de la exportación, en estado "en_cola".
2. GET /dashboard/empresas/exportaciones/{id}
   Consulta el estado cada tanto: en_cola -> procesando -> listo | error.
   Cuando está "listo" viene url_descarga.
3. GET /dashboard/empresas/exportaciones/{id}/descarga
   Devuelve el .xlsx.

Cada exportación solo la puede ver y descargar el admin que la pidió, y se
borra a los 30 minutos de terminada.
"""

cola_exportaciones = ColaTrabajos("exportaciones-empresas")


def _a_response(trabajo: Trabajo) -> ExportacionResponse:
    lista = trabajo.estado == EstadoTrabajo.LISTO
    return ExportacionResponse(
        id=trabajo.id,
        estado=trabajo.estado.value,
        posicion=cola_exportaciones.posicion(trabajo),
        creado_en=trabajo.creado_en,
        terminado_en=trabajo.terminado_en,
        error=trabajo.error,
        url_descarga=f"/api/v1/dashboard/empresas/exportaciones/{trabajo.id}/descarga" if lista else None,
    )


def _obtener_exportacion_o_404(exportacion_id: str, admin: dict) -> Trabajo:
    trabajo = cola_exportaciones.obtener(exportacion_id)
    # Mismo 404 si no existe, si venció o si es de otro admin: no se revela
    # que el id existe a quien no la pidió.
    if trabajo is None or trabajo.solicitante != int(admin["sub"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exportación no encontrada o vencida")
    return trabajo


@router.post("/", response_model=ExportacionResponse, status_code=status.HTTP_202_ACCEPTED)
def pedir_exportacion(filtros: FiltrosEmpresa = Depends(filtros_admin), admin: dict = Depends(require_admin)):
    """Encola la exportación a Excel de las empresas que cumplen los filtros
    (los mismos del buscador). Exclusivo de administradores."""
    try:
        trabajo = cola_exportaciones.encolar(
            lambda: generar_xlsx_empresas(filtros),
            solicitante=int(admin["sub"]),
            datos={"filtros": asdict(filtros)},
        )
    except ColaLlena:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hay demasiadas exportaciones en espera. Probá de nuevo en unos minutos.",
        )
    return _a_response(trabajo)


@router.get("/{exportacion_id}", response_model=ExportacionResponse)
def consultar_exportacion(exportacion_id: str, admin: dict = Depends(require_admin)):
    """Estado de una exportación pedida por el admin logueado."""
    return _a_response(_obtener_exportacion_o_404(exportacion_id, admin))


@router.get("/{exportacion_id}/descarga")
def descargar_exportacion(exportacion_id: str, admin: dict = Depends(require_admin)):
    """Descarga el .xlsx de una exportación ya terminada."""
    trabajo = _obtener_exportacion_o_404(exportacion_id, admin)
    if trabajo.estado == EstadoTrabajo.ERROR:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La exportación falló. Pedila de nuevo.")
    if trabajo.estado != EstadoTrabajo.LISTO:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La exportación todavía no está lista")

    nombre = f"empresas_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=trabajo.resultado,
        media_type=MEDIA_TYPE_XLSX,
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )
