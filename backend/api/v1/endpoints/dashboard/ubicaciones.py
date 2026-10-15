from fastapi import APIRouter, HTTPException, status
from db_connector import execute_query

router = APIRouter(prefix="/ubicaciones", tags=["Ubicaciones"])

# Departamentos y localidades de Córdoba (tablas zonas, departamentos y
# localidades de db/bigbang.sql, cargadas con db/insert_geografia.sql).
# Los usa el alta de empresa del dashboard de usuario para los desplegables.


@router.get("/departamentos")
def obtener_departamentos():
    # La zona va en la respuesta para que el alta de empresa la guarde en
    # ubicacion.zona (el buscador de empresas filtra por ese campo).
    query = (
        "SELECT d.id_departamento, d.nombre_departamento, z.nombre_zona "
        "FROM departamentos d JOIN zonas z ON z.id_zona = d.id_zona "
        "ORDER BY d.nombre_departamento ASC"
    )
    try:
        filas = execute_query(query, fetch=True) or []
    except Exception as e:
        print(f"Error al obtener departamentos en Oracle: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al consultar los departamentos",
        )
    return [{"id": int(f[0]), "nombre": str(f[1]), "zona": str(f[2])} for f in filas]


@router.get("/localidades/{id_departamento}")
def obtener_localidades_por_departamento(id_departamento: int):
    query = (
        "SELECT id_localidad, nombre_localidad FROM localidades "
        "WHERE id_departamento = :id_depto ORDER BY nombre_localidad ASC"
    )
    try:
        filas = execute_query(query, {"id_depto": id_departamento}, fetch=True) or []
    except Exception as e:
        print(f"Error al obtener localidades en Oracle: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al consultar las localidades",
        )
    return [{"id": int(f[0]), "nombre": str(f[1])} for f in filas]
