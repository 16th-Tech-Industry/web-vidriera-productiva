"""
Pruebas automáticas SENCILLAS de las validaciones de texto de Noticias
(título/cuerpo).

La creación real es multipart/form-data (título + cuerpo + imagen), así
que estos tests no pegan contra el endpoint ni necesitan servidor/DB:
prueban NoticiaBase (backend/api/v1/schemas/noticias.py), que documenta
las mismas reglas que el endpoint aplica vía
Form(..., min_length=..., max_length=...) en
api/v1/endpoints/noticias.py.

Cómo ejecutar:
    cd backend
    ./recursos/bin/python -m pytest validaciones -v
"""

import os
import sys

import pytest
from pydantic import ValidationError

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BACKEND_DIR)

from api.v1.schemas.noticias import NoticiaBase  # noqa: E402


def test_noticia_con_titulo_y_cuerpo_validos_se_acepta():
    datos = NoticiaBase(
        titulo="Nueva feria agroindustrial",
        cuerpo="Se viene la feria el mes que viene en el predio ferial.",
    )
    assert datos.titulo == "Nueva feria agroindustrial"


def test_noticia_con_titulo_muy_corto_se_rechaza():
    with pytest.raises(ValidationError):
        NoticiaBase(titulo="Hi", cuerpo="Cuerpo suficientemente largo")


def test_noticia_con_titulo_vacio_se_rechaza():
    with pytest.raises(ValidationError):
        NoticiaBase(titulo="", cuerpo="Cuerpo suficientemente largo")


def test_noticia_sin_cuerpo_se_rechaza():
    with pytest.raises(ValidationError):
        NoticiaBase(titulo="Titulo valido")


def test_noticia_con_cuerpo_muy_corto_se_rechaza():
    with pytest.raises(ValidationError):
        NoticiaBase(titulo="Titulo valido", cuerpo="corto")


def test_noticia_con_titulo_de_mas_de_200_caracteres_se_rechaza():
    with pytest.raises(ValidationError):
        NoticiaBase(titulo="a" * 201, cuerpo="Cuerpo suficientemente largo")
