from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from db_connector import execute_query

# El frontend las pide en /api/v1/postulaciones/...: sin prefijo las rutas
# quedaban en /api/v1/ y respondían 404.
router= APIRouter(prefix="/postulaciones")

class PostulacionCreate(BaseModel):
    id_empresa: int
    id_evento: int

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_postulacion(data: PostulacionCreate):
    query_check= """ SELECT COUNT(*) FROM POSTULACIONES 
    WHERE ID_EMPRESA= %(id_empresa)s AND ID_EVENTO= %(id_evento)s """
    #valida si ya existe la postulacion
    resultado= execute_query(
        query_check,
        {"id_empresa": data.id_empresa,
         "id_evento": data.id_evento},
         fetch=True
    )

    if resultado and resultado[0][0] > 0:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="Ya te postulaste a este evento"
        )
    #insert en tabla
    query_insert= """ INSERT INTO POSTULACIONES (ID_EMPRESA, ID_EVENTO, ESTADO)
                      VALUES (%(id_empresa)s, %(id_evento)s, 'PENDIENTE') """

    try:
       execute_query(
           query_insert,
           {"id_empresa": data.id_empresa, "id_evento": data.id_evento}
       )
       return{
           "mensaje": "Postulación registrada",
           "id_empresa": data.id_empresa, 
           "id_evento": data.id_evento
       }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar la postulacion: {str(e)}"
        )

@router.get("/empresa/{id_empresa}")
def obtener_postulaciones(id_empresa: int):
      query= """ SELECT p.ID_POSTULACION, p.ID_EMPRESA, p.ID_EVENTO,
                  TO_CHAR(p.FECHA_POSTULACION, 'YYYY-MM-DD') AS FECHA_POSTULACION, p.ESTADO,
                  p.MOTIVO_RECHAZO, e.TITULO, e.DESCRIPCION, e.FECHA, e.HORA, e.LUGAR, e.COLOR
                FROM POSTULACIONES p
                INNER JOIN EVENTOS e ON p.ID_EVENTO=e.ID_EVENTO
                WHERE p.ID_EMPRESA= %(id_empresa)s
                ORDER BY p.FECHA_POSTULACION DESC
             """
      filas= execute_query(query, {"id_empresa":id_empresa}, fetch=True)

      postulaciones= []
      if filas:
          for f in filas:
              postulaciones.append({
                  "id_postulacion": f[0],
                  "id_empresa": f[1],
                  "id_evento": f[2],
                  "fecha_postulacion": f[3],
                  "estado": f[4],
                  "motivo_rechazo": f[5],
                  "evento":{
                      "id": str(f[2]),
                      "titulo": f[6],
                      "descripcion": f[7],
                      "fecha": f[8],
                      "hora": f[9],
                      "lugar": f[10],
                      "color":f[11],
                  }
              })
      return postulaciones
#cancela postulacion
@router.delete("/empresa/{id_empresa}/evento/{id_evento}",
               status_code=status.HTTP_204_NO_CONTENT)
def cancelar_postulacion(id_empresa: int, id_evento: int):
    query= """ DELETE FROM POSTULACIONES
                WHERE ID_EMPRESA=%(id_empresa)s AND ID_EVENTO=%(id_evento)s """
    execute_query(query, {"id_empresa":id_empresa, "id_evento":id_evento})
    return None