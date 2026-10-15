# backend/api/v1/schemas/productos.py
from typing import Optional

from pydantic import BaseModel

# Los productos viven adentro del JSON de la empresa (empresas.datos_publico),
# en la clave "productos": un diccionario cuya clave es el id del producto.
#
#   "productos": {
#     "1": {"id": 1, "nombre": "...", "descripcion": "...",
#           "id_imagen": 12},   # tabla imagenes; None si no tiene
#     "2": {...}
#   }
#
# La lógica está en api/v1/servicios/productos_empresa.py.

NOMBRE_MAX_LENGTH = 150
DESCRIPCION_MAX_LENGTH = 1000
# Tope por empresa: el JSON se lee entero cada vez que se abre la ficha.
MAXIMO_PRODUCTOS = 50


# Salida (lo que devuelve la API)
class ProductoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str
    # Id de la imagen en la tabla imagenes (ver api/v1/servicios/imagenes.py).
    # None si el producto no tiene.
    id_imagen: Optional[int] = None
    # URL lista para usar en un <img>, armada a partir de id_imagen.
    imagen_url: Optional[str] = None
