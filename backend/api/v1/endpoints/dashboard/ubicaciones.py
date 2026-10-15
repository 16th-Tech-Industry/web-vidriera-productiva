from fastapi import APIRouter, HTTPException, status
from db_connector import execute_query

router = APIRouter(prefix="/ubicaciones", tags=["Ubicaciones"])


@router.get("/departamentos")
def obtener_departamentos():
    query = "SELECT ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO FROM DEPARTAMENTOS ORDER BY NOMBRE_DEPARTAMENTO ASC"
    try:
        filas = execute_query(query, fetch=True) or []
        return [{"id": int(f[0]), "nombre": str(f[1])} for f in filas]
    except Exception as e:
        print(f" Error al obtener departamentos en Oracle: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al consultar departamentos en BD: {str(e)}"
        )


@router.get("/localidades/{id_departamento}")
def obtener_localidades_por_departamento(id_departamento: int):
    query_principal = """
        SELECT ID_LOCALIDAD, NOMBRE_LOCALIDAD 
        FROM LOCALIDADES 
        WHERE ID_DEPARTAMENTO = :id_depto 
        ORDER BY NOMBRE_LOCALIDAD ASC
    """
    
    query_respaldo = """
        SELECT ID_LOCALIDAD, NOMBRE_LOCALIDAD 
        FROM LOCALIDADES 
        WHERE ID_DEPTO = :id_depto 
        ORDER BY NOMBRE_LOCALIDAD ASC
    """
@router.get("/localidades/{id_departamento}")
def obtener_localidades_por_departamento(id_departamento: int):
    query = """
        SELECT ID_LOCALIDAD, NOMBRE_LOCALIDAD 
        FROM LOCALIDADES 
        WHERE ID_DEPARTAMENTO = :id_depto 
        ORDER BY NOMBRE_LOCALIDAD ASC
    """
    # 📌 Ejecución directa sin try/except para revelar si Oracle arroja ORA-00904
    filas = execute_query(query, {"id_depto": id_departamento}, fetch=True) or []
    print(f"--> DEBUG LOCALIDADES para depto {id_departamento}: {filas}")
    return [{"id": int(f[0]), "nombre": str(f[1])} for f in filas]