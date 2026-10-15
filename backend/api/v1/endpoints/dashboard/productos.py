import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from api.v1.schemas.productos import (
    DESCRIPCION_MAX_LENGTH,
    MAXIMO_PRODUCTOS,
    NOMBRE_MAX_LENGTH,
    ProductoResponse,
)
from api.v1.servicios import imagenes, productos_empresa, vidriera_json
from api.v1.servicios.productos_empresa import LimiteDeProductos, ProductoNoEncontrado
from db_connector import execute_query
from security import get_current_user

router = APIRouter(prefix="/dashboard/empresas/mia/productos", tags=["Dashboard - Productos (usuario)"])

"""
Productos de "mi empresa" — cómo funciona:

1. Los productos no tienen tabla: son un diccionario adentro del JSON de la
   empresa (ver api/v1/servicios/productos_empresa.py). Cada endpoint lee
   el JSON de la empresa del representante logueado, le aplica el cambio y
   lo vuelve a guardar entero.
2. La imagen viaja como archivo (multipart/form-data, igual que noticias),
   se guarda en la tabla imagenes y en el JSON queda solo su id.
3. El representante solo llega a su propia empresa: sale de su JWT, no de
   un id en la URL.
4. Los cambios se publican directo: agregar o editar un producto no manda
   la empresa de nuevo a revisión.
5. Después de cada cambio se regenera el archivo JSON de la vidriera
   (api/v1/servicios/vidriera_json.py), que es de donde lee la parte pública.
"""


def _mi_empresa(usuario: dict):
    """Devuelve (id_empresa, datos_publico) de la empresa del representante logueado."""
    filas = execute_query(
        "SELECT id_empresa, datos_publico FROM empresas WHERE id_representante = %(id_representante)s",
        {"id_representante": int(usuario["sub"])},
        fetch=True,
    )
    if not filas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todavía no cargaste tu empresa")
    id_empresa, datos_publico = filas[0]
    return int(id_empresa), productos_empresa.leer_datos_publico(datos_publico)


def _guardar_datos(id_empresa: int, datos: dict) -> None:
    execute_query(
        "UPDATE empresas SET datos_publico = CAST(%(datos_publico)s AS jsonb) WHERE id_empresa = %(id)s",
        {"datos_publico": json.dumps(datos, ensure_ascii=False), "id": id_empresa},
    )
    # Los productos también figuran en el archivo del que lee la vidriera pública.
    vidriera_json.actualizar()


def _producto_o_404(datos: dict, producto_id: int) -> dict:
    try:
        return productos_empresa.obtener_producto(datos, producto_id)
    except ProductoNoEncontrado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.get("/", response_model=List[ProductoResponse])
def listar_mis_productos(usuario: dict = Depends(get_current_user)):
    """Productos de la empresa del representante logueado."""
    _, datos = _mi_empresa(usuario)
    return productos_empresa.listar_productos(datos)


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(
    nombre: str = Form(..., min_length=1, max_length=NOMBRE_MAX_LENGTH),
    descripcion: str = Form(..., min_length=1, max_length=DESCRIPCION_MAX_LENGTH),
    imagen: Optional[UploadFile] = File(None, description="Imagen del producto (opcional)"),
    usuario: dict = Depends(get_current_user),
):
    """Agrega un producto a la empresa del representante logueado."""
    id_empresa, datos = _mi_empresa(usuario)
    try:
        producto = productos_empresa.agregar_producto(datos, nombre, descripcion, None)
    except LimiteDeProductos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Llegaste al máximo de {MAXIMO_PRODUCTOS} productos por empresa",
        )

    if imagen is not None:
        producto["id_imagen"] = imagenes.guardar(*imagenes.leer_subida(imagen))

    try:
        _guardar_datos(id_empresa, datos)
    except Exception:
        # Si no se pudo guardar el producto, la imagen no queda huérfana.
        imagenes.borrar(producto["id_imagen"])
        raise
    return productos_empresa.producto_a_response(producto)


@router.patch("/{producto_id}", response_model=ProductoResponse)
def editar_producto(
    producto_id: int,
    nombre: Optional[str] = Form(None, min_length=1, max_length=NOMBRE_MAX_LENGTH),
    descripcion: Optional[str] = Form(None, min_length=1, max_length=DESCRIPCION_MAX_LENGTH),
    imagen: Optional[UploadFile] = File(None, description="Imagen nueva: reemplaza a la anterior"),
    usuario: dict = Depends(get_current_user),
):
    """Edita un producto. Solo cambia los campos que se envían."""
    id_empresa, datos = _mi_empresa(usuario)
    producto = _producto_o_404(datos, producto_id)

    if nombre is not None:
        producto["nombre"] = nombre
    if descripcion is not None:
        producto["descripcion"] = descripcion

    imagen_anterior = None
    if imagen is not None:
        imagen_anterior = producto.get("id_imagen")
        producto["id_imagen"] = imagenes.guardar(*imagenes.leer_subida(imagen))

    try:
        _guardar_datos(id_empresa, datos)
    except Exception:
        if imagen is not None:
            imagenes.borrar(producto["id_imagen"])
        raise
    # La imagen vieja se borra recién cuando el producto ya apunta a la nueva.
    imagenes.borrar(imagen_anterior)
    return productos_empresa.producto_a_response(producto)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(producto_id: int, usuario: dict = Depends(get_current_user)):
    """Elimina un producto y su imagen."""
    id_empresa, datos = _mi_empresa(usuario)
    _producto_o_404(datos, producto_id)
    producto = productos_empresa.quitar_producto(datos, producto_id)
    _guardar_datos(id_empresa, datos)
    imagenes.borrar(producto.get("id_imagen"))
