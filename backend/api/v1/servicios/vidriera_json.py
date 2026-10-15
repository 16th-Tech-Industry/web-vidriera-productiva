# backend/api/v1/servicios/vidriera_json.py
"""
Archivo JSON de la vidriera pública — el contenedor de lectura.

Qué es: un único archivo, backend/empresas_repo/empresas.json, con el
documento de cada empresa APROBADA (sus datos públicos y sus productos).
Es de donde lee la vidriera: el listado del mapa y la ficha de cada
empresa salen de este archivo, sin consultar la base.

Quién manda: la base de datos. La tabla `empresas` es la fuente de verdad y el
respaldo; el archivo es una copia que se puede borrar en cualquier momento
porque se vuelve a armar desde la tabla. Nunca se edita a mano ni se
escribe en él un dato que no esté antes en la base.

Cuándo se actualiza (siempre regenerándolo entero desde la base, que con
este volumen es una sola consulta):
- cuando un admin aprueba o rechaza una empresa (empresas_revision.py);
- cuando un representante agrega, edita o borra un producto (productos.py);
- cuando el archivo no se encuentra o no se puede leer: la primera lectura
  lo arma (por ejemplo después de un despliegue, que arranca con el disco
  vacío).

Forma del archivo:

    {
      "actualizado": "2026-10-12T18:00:00+00:00",
      "empresas": {
        "7": {"id_empresa": 7, "razon_social": "...", "nombre_empresa": "...",
              "rubro": "...", "ubicacion": {...}, "productos": {...}, ...}
      }
    }

Limitación: un cambio hecho directo en la base (por ejemplo desde DBeaver)
no se entera nadie. Para que la vidriera lo tome hay que borrar el archivo.
"""
import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

from api.v1.schemas.empresas import ESTADO_APROBADA
from api.v1.servicios import productos_empresa
from api.v1.servicios.busqueda_empresas import FiltrosEmpresa
from db_connector import execute_query

logger = logging.getLogger(__name__)

NOMBRE_ARCHIVO = "empresas.json"

# Una sola escritura a la vez: dos cambios simultáneos no se pisan el archivo.
_candado = threading.Lock()

# (id_empresa, razon_social, datos_publico): la misma forma de fila que
# devolvía la consulta a la base, así los endpoints no cambian su conversión.
Fila = Tuple[int, str, dict]


def ruta_archivo() -> Path:
    return productos_empresa.EMPRESAS_REPO_DIR / NOMBRE_ARCHIVO


def regenerar() -> dict:
    """Arma el archivo desde la base con todas las empresas aprobadas y devuelve su contenido."""
    with _candado:
        filas = execute_query(
            "SELECT id_empresa, razon_social, datos_publico FROM empresas "
            "WHERE estado = %(estado)s ORDER BY id_empresa",
            {"estado": ESTADO_APROBADA},
            fetch=True,
        )
        empresas = {}
        for id_empresa, razon_social, datos_publico in filas:
            datos = productos_empresa.leer_datos_publico(datos_publico)
            empresas[str(int(id_empresa))] = {**datos, "id_empresa": int(id_empresa), "razon_social": razon_social}
        contenido = {"actualizado": datetime.now(timezone.utc).isoformat(), "empresas": empresas}

        archivo = ruta_archivo()
        archivo.parent.mkdir(parents=True, exist_ok=True)
        # Se escribe aparte y se renombra: quien esté leyendo ve el archivo
        # viejo o el nuevo, nunca uno a medio escribir.
        temporal = archivo.with_suffix(".tmp")
        temporal.write_text(json.dumps(contenido, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temporal, archivo)
        return contenido


def actualizar() -> None:
    """Regenera el archivo después de un cambio. Nunca lanza: el cambio ya
    quedó guardado en la base y no se revierte porque falle la copia."""
    try:
        regenerar()
    except Exception:
        logger.exception("No se pudo actualizar %s; se regenera en la próxima lectura", NOMBRE_ARCHIVO)
        # Sin archivo, la próxima lectura lo arma de nuevo en vez de servir datos viejos.
        ruta_archivo().unlink(missing_ok=True)


def leer() -> dict:
    """Contenido del archivo. Si no está o está dañado, lo arma desde la base."""
    try:
        contenido = json.loads(ruta_archivo().read_text(encoding="utf-8"))
        if isinstance(contenido.get("empresas"), dict):
            return contenido
    except (FileNotFoundError, ValueError, AttributeError):
        pass
    return regenerar()


def _a_fila(documento: dict) -> Fila:
    datos = {clave: valor for clave, valor in documento.items() if clave not in ("id_empresa", "razon_social")}
    return documento["id_empresa"], documento["razon_social"], datos


def _cumple(documento: dict, filtros: FiltrosEmpresa) -> bool:
    ubicacion = documento.get("ubicacion") or {}
    if filtros.rubro and documento.get("rubro") != filtros.rubro:
        return False
    if filtros.zona and ubicacion.get("zona") != filtros.zona:
        return False
    if filtros.departamento and ubicacion.get("departamento") != filtros.departamento:
        return False
    if filtros.texto and filtros.texto.strip():
        buscado = filtros.texto.strip().lower()
        donde = f"{documento.get('razon_social') or ''}\n{documento.get('nombre_empresa') or ''}".lower()
        if buscado not in donde:
            return False
    return True


def empresas_publicas(filtros: Optional[FiltrosEmpresa] = None) -> List[Fila]:
    """Empresas aprobadas que cumplen los filtros (texto, rubro, zona, departamento), por id."""
    filtros = filtros or FiltrosEmpresa()
    documentos = sorted(leer()["empresas"].values(), key=lambda documento: documento["id_empresa"])
    return [_a_fila(documento) for documento in documentos if _cumple(documento, filtros)]


def empresa_publica(id_empresa: int) -> Optional[Fila]:
    """Una empresa aprobada, o None si no existe o no está aprobada."""
    documento = leer()["empresas"].get(str(int(id_empresa)))
    return _a_fila(documento) if documento else None
