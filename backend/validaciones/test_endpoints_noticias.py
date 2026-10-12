import sys
import os

# Agrega la carpeta backend al path para que Python encuentre main.py correctamente
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_listar_noticias_endpoint_exito():
    # --- Arrange ---
    
    # --- Act ---
    response = client.get("/api/v1/noticias/")
    
    # --- Assert ---
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_obtener_noticia_no_encontrada_endpoint():
    # --- Arrange ---
    noticia_id_inexistente = 99999
    
    # --- Act ---
    response = client.get(f"/api/v1/noticias/{noticia_id_inexistente}")
    
    # --- Assert ---
    assert response.status_code == 404
    assert response.json() == {"detail": "Noticia no encontrada"}


def test_crear_noticia_sin_autenticacion_falla():
    # --- Arrange ---
    payload_noticia = {
        "titulo": "Título de prueba automatizada",
        "cuerpo": "Cuerpo de la noticia con la longitud mínima requerida para pasar las reglas."
    }
    
    # --- Act ---
    response = client.post("/api/v1/noticias/", data=payload_noticia)
    
    # --- Assert ---
    assert response.status_code in [401, 403]


def test_actualizar_noticia_endpoint():
    # --- Arrange ---
    noticia_id = 1  # ID de prueba existente
    payload_actualizado = {
        "titulo": "Título actualizado automatizado",
        "cuerpo": "Cuerpo actualizado de la noticia con la longitud mínima requerida para pasar las reglas."
    }
    
    # --- Act ---
    # Usamos patch porque el endpoint en el backend está definido con @router.patch
    response = client.patch(f"/api/v1/noticias/{noticia_id}", data=payload_actualizado)
    
    # --- Assert ---
    assert response.status_code in [200, 401, 403, 404]


def test_eliminar_noticia_endpoint():
    # --- Arrange ---
    noticia_id = 1  # ID de prueba existente
    
    # --- Act ---
    response = client.delete(f"/api/v1/noticias/{noticia_id}")
    
    # --- Assert ---
    assert response.status_code in [200, 204, 401, 403, 404]