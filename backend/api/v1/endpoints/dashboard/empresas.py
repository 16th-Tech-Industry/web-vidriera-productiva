import json

from fastapi import APIRouter, Depends, HTTPException, status

from api.v1.schemas.empresas import ESTADO_PENDIENTE, EmpresaCreate, EmpresaResponse
from db_connector import execute_query
from security import get_current_user

router = APIRouter(prefix="/dashboard/empresas", tags=["Dashboard - Empresas (usuario)"])

_SELECT_EMPRESA = (
    "SELECT id_empresa, cuit, razon_social, datos_publico, id_representante, estado, motivo_rechazo "
    "FROM empresas"
)


def _fila_a_response(fila) -> EmpresaResponse:
    id_empresa, cuit, razon_social, datos_publico, id_representante, estado, motivo_rechazo = fila
    # datos_publico es una columna JSON nativa de Oracle: python-oracledb
    # la devuelve ya decodificada (dict), pero si en algún momento vuelve
    # como texto (driver/versión distinta) lo parseamos igual.
    datos = datos_publico if isinstance(datos_publico, dict) else json.loads(datos_publico)
    return EmpresaResponse(
        id_empresa=id_empresa,
        cuit=int(cuit),
        razon_social=razon_social,
        nombre_empresa=datos["nombre_empresa"],
        rubro=datos["rubro"],
        ubicacion=datos["ubicacion"],
        descripcion=datos["descripcion"],
        correo_empresa=datos["correo_empresa"],
        redes=datos.get("redes", {}),
        id_representante=int(id_representante),
        estado=int(estado),
        motivo_rechazo=motivo_rechazo,
    )


@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
def crear_empresa(empresa: EmpresaCreate, usuario: dict = Depends(get_current_user)):
    """Da de alta la empresa del representante logueado. Nace en estado
    pendiente: no aparece en la vidriera pública hasta que un admin la aprueba
    (ver empresas_revision.py). Cada representante tiene una sola empresa, así
    que esto es alta única (ver obtener_mi_empresa/GET /mia más abajo)."""
    ya_tiene_empresa = execute_query(
        "SELECT id_empresa FROM empresas WHERE id_representante = :id_representante",
        {"id_representante": int(usuario["sub"])},
        fetch=True,
    )
    if ya_tiene_empresa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tenés una empresa cargada. Un representante solo puede tener una.",
        )

    existe = execute_query(
        "SELECT id_empresa FROM empresas WHERE cuit = :cuit",
        {"cuit": empresa.cuit},
        fetch=True,
    )
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una empresa con ese CUIT")

    datos_publico = {
        "nombre_empresa": empresa.nombre_empresa,
        "rubro": empresa.rubro,
        "ubicacion": empresa.ubicacion.model_dump(),
        "descripcion": empresa.descripcion,
        "correo_empresa": empresa.correo_empresa,
        "redes": empresa.redes.model_dump(),
    }

    execute_query(
        "INSERT INTO empresas (cuit, razon_social, datos_publico, id_representante, estado) "
        "VALUES (:cuit, :razon_social, :datos_publico, :id_representante, :estado)",
        {
            "cuit": empresa.cuit,
            "razon_social": empresa.razon_social,
            "datos_publico": json.dumps(datos_publico, ensure_ascii=False),
            "id_representante": int(usuario["sub"]),
            "estado": ESTADO_PENDIENTE,
        },
    )

    # Mismo patrón que noticias.py/register.py: execute_query no expone el
    # id generado, así que se busca de nuevo por cuit (único de negocio).
    nueva = execute_query(
        _SELECT_EMPRESA + " WHERE cuit = :cuit",
        {"cuit": empresa.cuit},
        fetch=True,
    )
    return _fila_a_response(nueva[0])


@router.get("/mia", response_model=EmpresaResponse)
def obtener_mi_empresa(usuario: dict = Depends(get_current_user)):
    """La empresa del representante logueado, con su estado de revisión
    (pendiente/aprobada/rechazada) — para que el dashboard usuario muestre en qué
    quedó su alta. Es un objeto único, no una lista: un representante tiene como
    máximo una empresa (ver crear_empresa/POST más arriba)."""
    filas = execute_query(
        _SELECT_EMPRESA + " WHERE id_representante = :id_representante",
        {"id_representante": int(usuario["sub"])},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todavía no cargaste tu empresa")
    return _fila_a_response(filas[0])
