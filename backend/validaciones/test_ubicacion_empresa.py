"""Validación de la ubicación en el alta de empresa: el punto tiene que caer
dentro de Córdoba (api/v1/schemas/empresas.py, UbicacionEmpresaAlta)."""

import json

import pytest
from pydantic import ValidationError

from api.v1.endpoints.dashboard import empresas
from api.v1.schemas.empresas import EmpresaCreate, EmpresaResponse


def _alta(latitud, longitud) -> dict:
    return {
        "cuit": 20123456789,
        "razon_social": "Quesos SRL",
        "nombre_empresa": "Quesos del Valle",
        "rubro": "AGROALIMENTO",
        "ubicacion": {
            "zona": "Zona 5", "departamento": "CALAMUCHITA", "localidad": "AMBOY",
            "calle": "Ruta 5", "numero": 10, "latitud": latitud, "longitud": longitud,
        },
        "descripcion": "Quesos artesanales",
        "correo_empresa": "contacto@quesos.com",
    }


def test_acepta_un_punto_en_cordoba():
    empresa = EmpresaCreate(**_alta(-32.17, -64.57))
    assert empresa.ubicacion.latitud == -32.17


@pytest.mark.parametrize(
    "latitud, longitud",
    [
        (-64.18, -31.42),  # latitud y longitud cargadas al revés
        (-34.60, -58.38),  # Buenos Aires
        (-24.78, -65.41),  # Salta
        (0, 0),
    ],
)
def test_rechaza_un_punto_fuera_de_cordoba(latitud, longitud):
    with pytest.raises(ValidationError):
        EmpresaCreate(**_alta(latitud, longitud))


def test_la_respuesta_no_exige_cordoba():
    # Una empresa ya guardada con un valor viejo se sigue pudiendo mostrar.
    datos = _alta(-34.60, -58.38)
    respuesta = EmpresaResponse(**datos, id_empresa=1, id_representante=1, estado=1, redes={})
    assert respuesta.ubicacion.longitud == -58.38


def test_el_alta_guarda_la_zona_de_la_base(monkeypatch):
    # El navegador manda cualquier zona; se guarda la del departamento en la base.
    insertados = []

    def execute_query(query, params=None, fetch=False):
        if "FROM departamentos" in query:
            return [("Zona 5",)] if params["departamento"] == "CALAMUCHITA" else []
        if query.startswith("INSERT"):
            insertados.append(json.loads(params["datos_publico"]))
            return None
        if "WHERE cuit" in query and insertados:
            return [(9, params["cuit"], "Quesos SRL", insertados[0], 7, 0, None)]
        return []

    monkeypatch.setattr(empresas, "execute_query", execute_query)
    datos = _alta(-32.17, -64.57)
    datos["ubicacion"]["zona"] = "CALAMUCHITA"

    empresa = empresas.crear_empresa(EmpresaCreate(**datos), usuario={"sub": "7"})

    assert insertados[0]["ubicacion"]["zona"] == "Zona 5"
    assert empresa.ubicacion.zona == "Zona 5"
