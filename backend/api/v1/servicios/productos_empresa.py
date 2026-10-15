# backend/api/v1/servicios/productos_empresa.py
"""
Productos de una empresa.

Dónde se guardan: adentro del JSON de la empresa (empresas.datos_publico),
en la clave "productos". No hay tabla de productos: la empresa y sus
productos se leen siempre juntos, así que la ficha completa sale con una
sola consulta por clave primaria. La forma del diccionario está en
api/v1/schemas/productos.py.

Dónde van las imágenes: en la tabla imagenes (api/v1/servicios/imagenes.py);
el producto guarda solo su id ("id_imagen").

Este módulo no sabe de HTTP ni de la base: trabaja sobre el diccionario
`datos_publico` ya leído. Quien lo llama (los endpoints
de dashboard/productos.py) lee la fila, aplica el cambio y la vuelve a
guardar.
"""
import json
from pathlib import Path
from typing import List, Optional

from api.v1.schemas.productos import MAXIMO_PRODUCTOS, ProductoResponse
from api.v1.servicios import imagenes

# Carpeta del archivo JSON de la vidriera (ver vidriera_json.py). No necesita
# persistir: si se pierde, se vuelve a armar desde la base.
NOMBRE_CARPETA = "empresas_repo"
EMPRESAS_REPO_DIR = Path(__file__).resolve().parent.parent.parent.parent / NOMBRE_CARPETA


class ProductoNoEncontrado(LookupError):
    pass


class LimiteDeProductos(ValueError):
    pass


# --- Lectura del JSON de la empresa --------------------------------------


def leer_datos_publico(datos_publico) -> dict:
    """Pasa empresas.datos_publico a un diccionario que se puede modificar y
    volver a guardar con json.dumps. psycopg entrega la columna jsonb ya
    decodificada; si llegara como texto, se decodifica acá."""
    return datos_publico if isinstance(datos_publico, dict) else json.loads(datos_publico)


# --- Diccionario de productos --------------------------------------------


def producto_a_response(producto: dict) -> ProductoResponse:
    id_imagen = producto.get("id_imagen")
    return ProductoResponse(
        id=producto["id"],
        nombre=producto["nombre"],
        descripcion=producto["descripcion"],
        id_imagen=id_imagen,
        imagen_url=imagenes.url(id_imagen),
    )


def listar_productos(datos_publico: dict) -> List[ProductoResponse]:
    """Productos de la empresa, ordenados por id. Lista vacía si todavía no cargó ninguno."""
    productos = datos_publico.get("productos") or {}
    return [producto_a_response(p) for p in sorted(productos.values(), key=lambda p: p["id"])]


def obtener_producto(datos_publico: dict, producto_id: int) -> dict:
    producto = (datos_publico.get("productos") or {}).get(str(producto_id))
    if producto is None:
        raise ProductoNoEncontrado(producto_id)
    return producto


def agregar_producto(datos_publico: dict, nombre: str, descripcion: str, id_imagen: Optional[int]) -> dict:
    """Suma un producto al diccionario (modifica `datos_publico`) y lo devuelve."""
    productos = datos_publico.setdefault("productos", {})
    if len(productos) >= MAXIMO_PRODUCTOS:
        raise LimiteDeProductos(MAXIMO_PRODUCTOS)
    nuevo_id = max((p["id"] for p in productos.values()), default=0) + 1
    producto = {
        "id": nuevo_id,
        "nombre": nombre,
        "descripcion": descripcion,
        "id_imagen": id_imagen,
    }
    productos[str(nuevo_id)] = producto
    return producto


def quitar_producto(datos_publico: dict, producto_id: int) -> dict:
    """Saca el producto del diccionario y lo devuelve (para poder borrar su imagen)."""
    obtener_producto(datos_publico, producto_id)
    return datos_publico["productos"].pop(str(producto_id))
