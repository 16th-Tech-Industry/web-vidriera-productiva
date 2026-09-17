"""
Pruebas automáticas SENCILLAS de las validaciones del Backend (FastAPI + Pydantic).

Qué se prueba: los "schemas" de Pydantic que usan los endpoints de
login y registro (backend/api/v1/schemas/users.py). Pydantic valida el
JSON que llega ANTES de tocar la base de datos, así que estas pruebas
NO necesitan la base Oracle ni levantar el servidor.

Cómo ejecutar:
    cd backend
    ./recursos/bin/pip install pytest email-validator      # si falta
    ./recursos/bin/python -m pytest validaciones -v

Cada test se corresponde con un caso de prueba de la planilla
"Copia de Planilla Test Case.xlsx" (hojas Login y Registro).
"""

import os
import sys

import pytest
from pydantic import ValidationError

# Permite importar el paquete del backend (carpeta padre de este archivo)
# sin necesidad de instalarlo como paquete.
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BACKEND_DIR)

from api.v1.schemas.users import LoginRequest, UserCreate, ResetPasswordRequest  # noqa: E402


# ---------- Módulo LOGIN (schema LoginRequest) ----------

def test_TC_L_08_login_con_datos_validos_se_acepta():
    datos = LoginRequest(email="usuario@correo.com", password="Clave1234")
    assert datos.email == "usuario@correo.com"


def test_TC_L_09_login_con_email_sin_arroba_se_rechaza():
    with pytest.raises(ValidationError):
        LoginRequest(email="noesunemail", password="Clave1234")


def test_TC_L_10_login_con_password_de_menos_de_8_se_rechaza():
    with pytest.raises(ValidationError):
        LoginRequest(email="usuario@correo.com", password="corta")


def test_TC_L_11_login_sin_password_se_rechaza():
    with pytest.raises(ValidationError):
        LoginRequest(email="usuario@correo.com")


# ---------- Módulo REGISTRO (schema UserCreate) ----------

def test_TC_R_08_registro_con_datos_validos_se_acepta():
    datos = UserCreate(
        email="ana.perez@correo.com",
        name="Ana",
        apellido="Perez",
        password="Clave1234",
    )
    assert datos.name == "Ana"


def test_TC_R_09_registro_con_nombre_de_1_letra_se_rechaza():
    # name tiene min_length=2 en el schema.
    with pytest.raises(ValidationError):
        UserCreate(email="ana@correo.com", name="A", apellido="Perez", password="Clave1234")


def test_TC_R_10_registro_sin_apellido_se_rechaza():
    with pytest.raises(ValidationError):
        UserCreate(email="ana@correo.com", name="Ana", password="Clave1234")


def test_TC_R_11_registro_con_email_invalido_se_rechaza():
    with pytest.raises(ValidationError):
        UserCreate(email="ana#correo", name="Ana", apellido="Perez", password="Clave1234")


def test_TC_R_12_registro_con_password_corta_se_rechaza():
    with pytest.raises(ValidationError):
        UserCreate(email="ana@correo.com", name="Ana", apellido="Perez", password="1234")


# ---------- Módulo RECUPERAR CONTRASEÑA (schema ResetPasswordRequest) ----------

def test_TC_RC_01_reset_password_con_nueva_password_corta_se_rechaza():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="abc123", new_password="corta")


def test_TC_RC_02_reset_password_con_datos_validos_se_acepta():
    datos = ResetPasswordRequest(token="abc123", new_password="NuevaClave1")
    assert datos.token == "abc123"
