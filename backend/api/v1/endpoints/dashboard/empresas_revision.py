from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from api.v1.endpoints.dashboard.empresas import _SELECT_EMPRESA, _fila_a_response
from api.v1.schemas.empresas import (
    ESTADO_APROBADA,
    ESTADO_PENDIENTE,
    ESTADO_RECHAZADA,
    EmpresaResponse,
    RechazoEmpresaRequest,
)
from db_connector import execute_query
from security import require_admin

router = APIRouter(prefix="/dashboard/empresas", tags=["Dashboard - Empresas (admin)"])


def _obtener_empresa_o_404(empresa_id: int):
    filas = execute_query(_SELECT_EMPRESA + " WHERE id_empresa = :id", {"id": empresa_id}, fetch=True)
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return filas[0]


@router.get("/pendientes", response_model=List[EmpresaResponse])
def listar_pendientes(admin: dict = Depends(require_admin)):
    """Empresas cargadas por usuarios que todavía no fueron revisadas. Exclusivo de administradores."""
    filas = execute_query(
        _SELECT_EMPRESA + " WHERE estado = :estado ORDER BY id_empresa",
        {"estado": ESTADO_PENDIENTE},
        fetch=True,
    )
    return [_fila_a_response(fila) for fila in filas]


@router.patch("/{empresa_id}/aprobar", response_model=EmpresaResponse)
def aprobar_empresa(empresa_id: int, admin: dict = Depends(require_admin)):
    """Aprueba una empresa pendiente: pasa a estado aprobada y queda visible en la
    vidriera pública. Exclusivo de administradores."""
    _obtener_empresa_o_404(empresa_id)
    execute_query(
        "UPDATE empresas SET estado = :estado, motivo_rechazo = NULL WHERE id_empresa = :id",
        {"estado": ESTADO_APROBADA, "id": empresa_id},
    )
    return _fila_a_response(_obtener_empresa_o_404(empresa_id))


@router.patch("/{empresa_id}/rechazar", response_model=EmpresaResponse)
def rechazar_empresa(empresa_id: int, payload: RechazoEmpresaRequest, admin: dict = Depends(require_admin)):
    """Rechaza una empresa pendiente, con un motivo que el usuario ve en su dashboard.
    Exclusivo de administradores."""
    _obtener_empresa_o_404(empresa_id)
    execute_query(
        "UPDATE empresas SET estado = :estado, motivo_rechazo = :motivo WHERE id_empresa = :id",
        {"estado": ESTADO_RECHAZADA, "motivo": payload.motivo_rechazo, "id": empresa_id},
    )
    return _fila_a_response(_obtener_empresa_o_404(empresa_id))
