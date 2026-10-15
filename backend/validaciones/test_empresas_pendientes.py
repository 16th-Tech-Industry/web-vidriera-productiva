"""Lista de empresas pendientes del dashboard admin
(GET /dashboard/empresas/pendientes, en endpoints/dashboard/empresas_revision.py)."""

from api.v1.endpoints.dashboard import empresas_revision

DATOS_EMPRESA = {
    "nombre_empresa": "Sabores Serranos",
    "rubro": "AGROALIMENTO",
    "ubicacion": {
        "zona": "Zona 5", "departamento": "CALAMUCHITA", "localidad": "Villa General Belgrano",
        "calle": "San Martín", "numero": 123, "latitud": -31.97, "longitud": -64.55,
    },
    "descripcion": "Dulces artesanales",
    "correo_empresa": "contacto@sabores.com",
}


def _base_falsa(empresas, representantes):
    def execute_query(query, params=None, fetch=False):
        if "FROM representates" in query:
            return representantes
        return empresas
    return execute_query


def test_trae_el_contacto_del_representante(monkeypatch):
    empresas = [(3, 30712345678, "Sabores Serranos SRL", DATOS_EMPRESA, 7, 0, None)]
    representantes = [(7, "Ana", "Pérez", "ana@correo.com", "3515550101")]
    monkeypatch.setattr(empresas_revision, "execute_query", _base_falsa(empresas, representantes))

    (pendiente,) = empresas_revision.listar_pendientes(admin={})

    assert pendiente.id_empresa == 3
    assert pendiente.representante.nombre == "Ana"
    assert pendiente.representante.telefono == "3515550101"


def test_saltea_una_empresa_con_el_json_incompleto(monkeypatch):
    # Una empresa cargada a mano sin nombre_empresa no tira abajo la lista con un 500.
    empresas = [
        (1, 30700000000, "Empresa Demo SRL", {"rubro": "Agroindustria"}, 7, 0, None),
        (3, 30712345678, "Sabores Serranos SRL", DATOS_EMPRESA, 7, 0, None),
    ]
    monkeypatch.setattr(empresas_revision, "execute_query", _base_falsa(empresas, []))

    pendientes = empresas_revision.listar_pendientes(admin={})

    assert [p.id_empresa for p in pendientes] == [3]
    assert pendientes[0].representante is None
