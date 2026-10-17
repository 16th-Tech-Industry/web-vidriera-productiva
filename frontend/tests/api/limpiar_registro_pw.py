"""Borra de Oracle los representantes creados por los tests de Playwright (email `pwtest.%`).

Uso (desde backend/): ./.venv/bin/python ../frontend/tests/api/limpiar_registro_pw.py
"""
import os
import sys

sys.path.insert(0, os.getcwd())
from db_connector import execute_query  # noqa: E402

filas = execute_query(
    "SELECT COUNT(*) FROM representates WHERE email_representante LIKE 'pwtest.%'", fetch=True
)
execute_query("DELETE FROM representates WHERE email_representante LIKE 'pwtest.%'")
print(f"Borrados {filas[0][0]} representantes de prueba")
