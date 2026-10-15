from fastapi import APIRouter, status, Depends, HTTPException
from typing import List

from api.v1.schemas.eventos import EventoCreate, EventoUpdate, EventoResponse
from db_connector import execute_query
from security import require_admin

router = APIRouter(prefix="/eventos", tags=["Eventos"])

_SELECT_EVENTO= (
    "SELECT id_evento, fecha, titulo, TO_CHAR(descripcion), hora, lugar, color FROM eventos"
)

def _fila_a_response(fila) -> EventoResponse:
    id_evento, fecha, titulo, descripcion, hora, lugar, color= fila
    desc_texto= descripcion.read() if hasattr(descripcion, "read") else str(descripcion or "")

    return EventoResponse(
        id= str(id_evento),
        fecha=str(fecha),
        titulo=str(titulo),
        descripcion=str(descripcion or ""),
        hora=hora,
        lugar=lugar,
        color=str(color or "blue")
    )

@router.get("/", response_model=List[EventoResponse])
def listar_eventos():
    """listado de eventos"""
    filas= execute_query(_SELECT_EVENTO + " ORDER BY fecha ASC", fetch=True)
    return [_fila_a_response(fila) for fila in filas]

@router.get("/{evento_id}", response_model=EventoResponse)
def obtener_evento(evento_id: int):
    filas= execute_query(
        _SELECT_EVENTO + " WHERE id_evento= :id",
        {"id": evento_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")
    return _fila_a_response(filas[0])

@router.post("/", response_model=EventoResponse, status_code=status.HTTP_201_CREATED)
def crear_evento(datos: EventoCreate, admin: dict= Depends(require_admin)):
    """crear evento nuevo"""
    execute_query(
        "INSERT INTO eventos (fecha, titulo, descripcion, hora, lugar, color)" "VALUES (:fecha, :titulo, :descripcion, :hora, :lugar, :color)",
        {
            "fecha": datos.fecha,
            "titulo": datos.titulo,
            "descripcion": datos.descripcion,
            "hora": datos.hora,
            "lugar": datos.lugar,
            "color": datos.color,
        },
    )

    nuevo= execute_query(
        _SELECT_EVENTO+ " WHERE titulo= :titulo AND fecha= :fecha ORDER BY fecha ASC",
        {"titulo": datos.titulo, "fecha": datos.fecha},
        fetch=True,
    )
    return _fila_a_response(nuevo[0])

@router.patch("/{evento_id}", response_model=EventoResponse)
def editar_evento(
    evento_id: int,
    datos: EventoUpdate,
    admin: dict= Depends(require_admin),
): 
    """editar eventos"""
    filas= execute_query(
        _SELECT_EVENTO+  " WHERE id_evento= :id",
        {"id": evento_id},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")

    execute_query(
        "UPDATE eventos SET fecha= :fecha, titulo= :titulo, descripcion= :descripcion,"
        "hora= :hora, lugar= :lugar, color= :color WHERE id_evento= :id",
        {
        "fecha": datos.fecha,
        "titulo": datos.titulo,
        "descripcion": datos.descripcion,
        "hora": datos.hora,
        "lugar": datos.lugar,
        "color": datos.color, 
        "id": evento_id,  
        },
)
    actualizado= execute_query(
        _SELECT_EVENTO+ " WHERE id_evento= :id",
        {"id": evento_id},
        fetch=True,
    )
    return _fila_a_response(actualizado[0])

@router.delete("/{evento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_evento(evento_id: int, admin: dict= Depends(require_admin)):
    """eliminar eventos"""
    filas= execute_query(
        "SELECT 1 FROM eventos WHERE id_evento= :id",
        {"id": evento_id},
        fetch=True,
    )
    if not filas: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")

    execute_query("DELETE FROM eventos WHERE id_evento= :id",{"id":evento_id})
    return None