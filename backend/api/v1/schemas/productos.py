# backend/api/v1/schemas/productos.py
from typing import Optional

from pydantic import BaseModel

# Los productos viven adentro del JSON de la empresa (empresas.datos_publico),
# en la clave "productos": un diccionario cuya clave es el id del producto.
#
#   "productos": {
#     "1": {"id": 1, "nombre": "...", "descripcion": "...",
#           "ubicacion_imagen": "empresas_repo/7/ab12.jpg"},
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
    # Dónde quedó guardada la imagen, relativo a la carpeta del backend
    # (empresas_repo/<id_empresa>/<archivo>). None si el producto no tiene.
    ubicacion_imagen: Optional[str] = None
    # URL lista para usar en un <img>, armada a partir de ubicacion_imagen.
    imagen_url: Optional[str] = None
