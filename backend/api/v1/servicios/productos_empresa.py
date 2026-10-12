# backend/api/v1/servicios/productos_empresa.py
"""
Productos de una empresa.

Dónde se guardan: adentro del JSON de la empresa (empresas.datos_publico),
en la clave "productos". No hay tabla de productos: la empresa y sus
productos se leen siempre juntos, así que la ficha completa sale con una
sola consulta por clave primaria. La forma del diccionario está en
api/v1/schemas/productos.py.

Dónde van las imágenes: en disco, no en la base. Cada empresa tiene su
carpeta, backend/empresas_repo/<id_empresa>/, y el JSON guarda solo la
ubicación del archivo ("empresas_repo/7/ab12.jpg"). main.py sirve esa
carpeta como estático, así que la ubicación es también la ruta de la URL.

Este módulo no sabe de HTTP ni de la base: trabaja sobre el diccionario
`datos_publico` ya leído y sobre el disco. Quien lo llama (los endpoints
de dashboard/productos.py) lee la fila, aplica el cambio y la vuelve a
guardar.
"""
import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from api.v1.schemas.productos import MAXIMO_PRODUCTOS, ProductoResponse

PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")

NOMBRE_CARPETA = "empresas_repo"
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
EMPRESAS_REPO_DIR = BACKEND_DIR / NOMBRE_CARPETA


class ProductoNoEncontrado(LookupError):
    pass


class LimiteDeProductos(ValueError):
    pass


# --- Diccionario de productos --------------------------------------------


def producto_a_response(producto: dict) -> ProductoResponse:
    ubicacion = producto.get("ubicacion_imagen")
    return ProductoResponse(
        id=producto["id"],
        nombre=producto["nombre"],
        descripcion=producto["descripcion"],
        ubicacion_imagen=ubicacion,
        imagen_url=f"{PUBLIC_BASE_URL}/{ubicacion}" if ubicacion else None,
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


def agregar_producto(datos_publico: dict, nombre: str, descripcion: str, ubicacion_imagen: Optional[str]) -> dict:
    """Suma un producto al diccionario (modifica `datos_publico`) y lo devuelve."""
    productos = datos_publico.setdefault("productos", {})
    if len(productos) >= MAXIMO_PRODUCTOS:
        raise LimiteDeProductos(MAXIMO_PRODUCTOS)
    nuevo_id = max((p["id"] for p in productos.values()), default=0) + 1
    producto = {
        "id": nuevo_id,
        "nombre": nombre,
        "descripcion": descripcion,
        "ubicacion_imagen": ubicacion_imagen,
    }
    productos[str(nuevo_id)] = producto
    return producto


def quitar_producto(datos_publico: dict, producto_id: int) -> dict:
    """Saca el producto del diccionario y lo devuelve (para poder borrar su imagen)."""
    obtener_producto(datos_publico, producto_id)
    return datos_publico["productos"].pop(str(producto_id))


# --- Imágenes en disco ---------------------------------------------------


def guardar_imagen(id_empresa: int, contenido: bytes, extension: str) -> str:
    """Escribe la imagen en la carpeta de la empresa y devuelve su ubicación."""
    carpeta = EMPRESAS_REPO_DIR / str(int(id_empresa))
    carpeta.mkdir(parents=True, exist_ok=True)
    # Nombre random: evita colisiones y que el navegador muestre la imagen
    # vieja desde su caché cuando se reemplaza la de un producto.
    nombre_archivo = f"{uuid.uuid4().hex}{extension}"
    (carpeta / nombre_archivo).write_bytes(contenido)
    return f"{NOMBRE_CARPETA}/{int(id_empresa)}/{nombre_archivo}"


def eliminar_imagen(id_empresa: int, ubicacion_imagen: Optional[str]) -> None:
    """Borra del disco la imagen de un producto. No falla si ya no está."""
    if not ubicacion_imagen:
        return
    carpeta = (EMPRESAS_REPO_DIR / str(int(id_empresa))).resolve()
    archivo = (BACKEND_DIR / ubicacion_imagen).resolve()
    # La ubicación sale del JSON de la base: solo se borra si de verdad
    # apunta adentro de la carpeta de esta empresa.
    if archivo.parent == carpeta:
        archivo.unlink(missing_ok=True)


def eliminar_carpeta(id_empresa: int) -> None:
    """Borra todas las imágenes de una empresa (para cuando se da de baja)."""
    shutil.rmtree(EMPRESAS_REPO_DIR / str(int(id_empresa)), ignore_errors=True)
