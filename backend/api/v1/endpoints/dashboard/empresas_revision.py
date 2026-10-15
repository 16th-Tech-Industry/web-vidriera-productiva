from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from api.v1.endpoints.dashboard.empresas import _COLUMNAS_EMPRESA, _SELECT_EMPRESA, _fila_a_response
from api.v1.endpoints.notificaciones import notificar_revision_empresa
from api.v1.schemas.empresas import (
    ESTADO_APROBADA,
    ESTADO_PENDIENTE,
    ESTADO_RECHAZADA,
    EmpresaPendienteResponse,
    EmpresaResponse,
    RechazoEmpresaRequest,
)
from api.v1.servicios.busqueda_empresas import (
    FiltrosEmpresa,
    buscar_empresas,
    convertir_filas,
    filtros_admin,
)
from api.v1.servicios import vidriera_json
from api.v1.servicios.correo import enviar_revision_empresa
from api.v1.servicios.paginacion import Pagina, Paginacion, armar_pagina, parametros_paginacion
from db_connector import execute_query
from security import require_admin

router = APIRouter(prefix="/dashboard/empresas", tags=["Dashboard - Empresas (admin)"])

# Posición de estado y motivo_rechazo en las filas de _SELECT_EMPRESA.
_COL_ESTADO = 5
_COL_MOTIVO = 6


def _obtener_empresa_o_404(empresa_id: int):
    filas = execute_query(_SELECT_EMPRESA + " WHERE id_empresa = %(id)s", {"id": empresa_id}, fetch=True)
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return filas[0]


def _avisar_al_representante(background_tasks: BackgroundTasks, empresa: EmpresaResponse) -> None:
    """Encola los dos avisos del resultado de la revisión: en vivo por WebSocket
    (si tiene el dashboard abierto) y por mail (le llega aunque no esté conectado).
    Salen después de responderle al admin, así un mail lento no demora la revisión."""
    aprobada = empresa.estado == ESTADO_APROBADA
    background_tasks.add_task(
        notificar_revision_empresa,
        empresa.id_representante, empresa.id_empresa, empresa.razon_social, aprobada, empresa.motivo_rechazo,
    )
    representante = execute_query(
        "SELECT email_representante, nombre_representante FROM representates WHERE id_representante = %(id)s",
        {"id": empresa.id_representante},
        fetch=True,
    )
    if representante:
        email, nombre = representante[0]
        background_tasks.add_task(
            enviar_revision_empresa, email, nombre, empresa.razon_social, aprobada, empresa.motivo_rechazo
        )


@router.get("/", response_model=Pagina[EmpresaResponse])
def buscar(
    filtros: FiltrosEmpresa = Depends(filtros_admin),
    paginacion: Paginacion = Depends(parametros_paginacion),
    admin: dict = Depends(require_admin),
):
    """Buscador de empresas del dashboard admin: combina texto, rubro, zona,
    departamento y estado (todos opcionales), paginado. Exclusivo de
    administradores. La lógica vive en api/v1/servicios/busqueda_empresas.py."""
    filas, total = buscar_empresas(_COLUMNAS_EMPRESA, filtros, paginacion)
    return armar_pagina(convertir_filas(filas, _fila_a_response), total, paginacion)


def _representantes_de_pendientes() -> dict:
    """Contacto de los representantes con empresas pendientes, por id."""
    filas = execute_query(
        "SELECT id_representante, nombre_representante, apellido_representante, "
        "email_representante, n_telefono_representante FROM representates "
        "WHERE id_representante IN (SELECT id_representante FROM empresas WHERE estado = %(estado)s)",
        {"estado": ESTADO_PENDIENTE},
        fetch=True,
    )
    return {
        int(id_rep): {"nombre": nombre, "apellido": apellido, "email": email, "telefono": telefono}
        for id_rep, nombre, apellido, email, telefono in filas
    }


@router.get("/pendientes", response_model=List[EmpresaPendienteResponse])
def listar_pendientes(admin: dict = Depends(require_admin)):
    """Empresas cargadas por usuarios que todavía no fueron revisadas, con el
    contacto de su representante. Exclusivo de administradores."""
    filas = execute_query(
        _SELECT_EMPRESA + " WHERE estado = %(estado)s ORDER BY id_empresa",
        {"estado": ESTADO_PENDIENTE},
        fetch=True,
    )
    representantes = _representantes_de_pendientes()
    return [
        EmpresaPendienteResponse(
            **empresa.model_dump(),
            representante=representantes.get(empresa.id_representante),
        )
        for empresa in convertir_filas(filas, _fila_a_response)
    ]


@router.patch("/{empresa_id}/aprobar", response_model=EmpresaResponse)
def aprobar_empresa(empresa_id: int, background_tasks: BackgroundTasks, admin: dict = Depends(require_admin)):
    """Aprueba una empresa pendiente: pasa a estado aprobada, queda visible en la
    vidriera pública y se le avisa al representante. Exclusivo de administradores."""
    estado_previo = _obtener_empresa_o_404(empresa_id)[_COL_ESTADO]
    execute_query(
        "UPDATE empresas SET estado = %(estado)s, motivo_rechazo = NULL WHERE id_empresa = %(id)s",
        {"estado": ESTADO_APROBADA, "id": empresa_id},
    )
    # La empresa entra al archivo del que lee la vidriera pública.
    vidriera_json.actualizar()
    empresa = _fila_a_response(_obtener_empresa_o_404(empresa_id))
    # Aprobar dos veces lo mismo no manda el aviso de nuevo.
    if estado_previo != ESTADO_APROBADA:
        _avisar_al_representante(background_tasks, empresa)
    return empresa


@router.patch("/{empresa_id}/rechazar", response_model=EmpresaResponse)
def rechazar_empresa(
    empresa_id: int,
    payload: RechazoEmpresaRequest,
    background_tasks: BackgroundTasks,
    admin: dict = Depends(require_admin),
):
    """Rechaza una empresa pendiente, con un motivo que el usuario ve en su dashboard
    y recibe en el aviso. Exclusivo de administradores."""
    previa = _obtener_empresa_o_404(empresa_id)
    execute_query(
        "UPDATE empresas SET estado = %(estado)s, motivo_rechazo = %(motivo)s WHERE id_empresa = %(id)s",
        {"estado": ESTADO_RECHAZADA, "motivo": payload.motivo_rechazo, "id": empresa_id},
    )
    # Si estaba aprobada, sale del archivo del que lee la vidriera pública.
    vidriera_json.actualizar()
    empresa = _fila_a_response(_obtener_empresa_o_404(empresa_id))
    # Un rechazo repetido solo se vuelve a avisar si cambió el motivo.
    if previa[_COL_ESTADO] != ESTADO_RECHAZADA or previa[_COL_MOTIVO] != payload.motivo_rechazo:
        _avisar_al_representante(background_tasks, empresa)
    return empresa
