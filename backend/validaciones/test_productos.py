"""
Pruebas de los productos de una empresa: el diccionario que vive adentro
de empresas.datos_publico y las imágenes en disco
(api/v1/servicios/productos_empresa.py), más los endpoints del dashboard
(api/v1/endpoints/dashboard/productos.py) y la ficha pública (landing.py).

No necesitan Oracle: la base se reemplaza por una fila en memoria y las
imágenes se escriben en una carpeta temporal.
"""
import copy
import json
from decimal import Decimal
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile

from api.v1.endpoints import landing
from api.v1.endpoints.dashboard import empresas, productos
from api.v1.schemas.productos import MAXIMO_PRODUCTOS
from api.v1.servicios import productos_empresa, vidriera_json
from api.v1.servicios.busqueda_empresas import FiltrosEmpresa

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
USUARIO = {"sub": "7"}
ID_EMPRESA = 3


def _como_oracle(valor):
    """Oracle devuelve los números de una columna JSON como Decimal."""
    if isinstance(valor, bool) or valor is None or isinstance(valor, str):
        return valor
    if isinstance(valor, (int, float)):
        return Decimal(str(valor))
    if isinstance(valor, dict):
        return {clave: _como_oracle(item) for clave, item in valor.items()}
    return [_como_oracle(item) for item in valor]


class BaseFalsa:
    """Reemplazo de execute_query con la empresa 3 del representante 7."""

    def __init__(self, estado: int = 1):
        self.datos = copy.deepcopy(DATOS_EMPRESA)
        self.estado = estado
        self.consultas = 0

    def __call__(self, query, params=None, fetch=False):
        if query.startswith("UPDATE"):
            assert params["id"] == ID_EMPRESA
            self.datos = json.loads(params["datos_publico"])
            return None
        self.consultas += 1
        if "id_representante = :id_representante" in query:
            if params["id_representante"] != 7:
                return []
            return [(ID_EMPRESA, _como_oracle(self.datos))]
        # Lo que pide vidriera_json.regenerar(): las aprobadas.
        if params["estado"] != self.estado:
            return []
        return [(Decimal(ID_EMPRESA), "Sabores Serranos SRL", _como_oracle(self.datos))]


@pytest.fixture
def base(monkeypatch, tmp_path):
    falsa = BaseFalsa()
    monkeypatch.setattr(productos, "execute_query", falsa)
    monkeypatch.setattr(vidriera_json, "execute_query", falsa)
    monkeypatch.setattr(productos_empresa, "BACKEND_DIR", tmp_path)
    monkeypatch.setattr(productos_empresa, "EMPRESAS_REPO_DIR", tmp_path / "empresas_repo")
    monkeypatch.setattr(productos_empresa, "PUBLIC_BASE_URL", "http://api.local")
    falsa.raiz = tmp_path
    return falsa


def _imagen(nombre: str = "foto.JPG", contenido: bytes = b"imagen") -> UploadFile:
    return UploadFile(file=BytesIO(contenido), filename=nombre)


def _crear(nombre="Dulce de Leche", descripcion="Artesanal", imagen=None, usuario=USUARIO):
    return productos.crear_producto(nombre=nombre, descripcion=descripcion, imagen=imagen, usuario=usuario)


# --- alta ----------------------------------------------------------------


def test_el_producto_se_guarda_como_diccionario_dentro_del_json_de_la_empresa(base):
    creado = _crear()
    assert creado.id == 1
    assert base.datos["productos"] == {
        "1": {"id": 1, "nombre": "Dulce de Leche", "descripcion": "Artesanal", "ubicacion_imagen": None}
    }
    # El resto del JSON de la empresa queda intacto.
    assert {clave: valor for clave, valor in base.datos.items() if clave != "productos"} == DATOS_EMPRESA


def test_la_imagen_va_a_la_carpeta_de_la_empresa(base):
    creado = _crear(imagen=_imagen())
    assert creado.ubicacion_imagen.startswith(f"empresas_repo/{ID_EMPRESA}/")
    assert creado.ubicacion_imagen.endswith(".jpg")
    assert creado.imagen_url == f"http://api.local/{creado.ubicacion_imagen}"
    assert (base.raiz / creado.ubicacion_imagen).read_bytes() == b"imagen"


def test_los_ids_son_correlativos(base):
    assert [_crear().id, _crear().id, _crear().id] == [1, 2, 3]
    assert [p.id for p in productos.listar_mis_productos(usuario=USUARIO)] == [1, 2, 3]


def test_formato_de_imagen_no_permitido_no_guarda_nada(base):
    with pytest.raises(HTTPException) as error:
        _crear(imagen=_imagen("virus.exe"))
    assert error.value.status_code == 400
    assert "productos" not in base.datos
    assert not (base.raiz / "empresas_repo").exists()


def test_tope_de_productos_por_empresa(base):
    base.datos["productos"] = {
        str(i): {"id": i, "nombre": "x", "descripcion": "x", "ubicacion_imagen": None}
        for i in range(1, MAXIMO_PRODUCTOS + 1)
    }
    with pytest.raises(HTTPException) as error:
        _crear()
    assert error.value.status_code == 400
    assert len(base.datos["productos"]) == MAXIMO_PRODUCTOS


def test_sin_empresa_cargada_devuelve_404(base):
    with pytest.raises(HTTPException) as error:
        _crear(usuario={"sub": "99"})
    assert error.value.status_code == 404


def test_si_falla_la_base_la_imagen_no_queda_huerfana(base, monkeypatch):
    def falla(*_, **__):
        raise RuntimeError("sin conexión")

    monkeypatch.setattr(productos, "_guardar_datos", falla)
    with pytest.raises(RuntimeError):
        _crear(imagen=_imagen())
    assert list((base.raiz / "empresas_repo" / str(ID_EMPRESA)).iterdir()) == []


# --- edición y baja ------------------------------------------------------


def test_editar_cambia_solo_lo_que_se_envia(base):
    _crear(imagen=_imagen())
    ubicacion = base.datos["productos"]["1"]["ubicacion_imagen"]
    editado = productos.editar_producto(1, nombre="Dulce de Leche Repostero", descripcion=None, imagen=None, usuario=USUARIO)
    assert (editado.nombre, editado.descripcion, editado.ubicacion_imagen) == (
        "Dulce de Leche Repostero", "Artesanal", ubicacion,
    )


def test_reemplazar_la_imagen_borra_la_anterior(base):
    _crear(imagen=_imagen(contenido=b"vieja"))
    vieja = base.datos["productos"]["1"]["ubicacion_imagen"]
    editado = productos.editar_producto(1, nombre=None, descripcion=None, imagen=_imagen("otra.png", b"nueva"), usuario=USUARIO)
    assert editado.ubicacion_imagen != vieja
    assert not (base.raiz / vieja).exists()
    assert (base.raiz / editado.ubicacion_imagen).read_bytes() == b"nueva"


def test_eliminar_saca_el_producto_y_su_imagen(base):
    _crear(imagen=_imagen())
    _crear()
    ubicacion = base.datos["productos"]["1"]["ubicacion_imagen"]
    productos.eliminar_producto(1, usuario=USUARIO)
    assert list(base.datos["productos"]) == ["2"]
    assert not (base.raiz / ubicacion).exists()


def test_producto_inexistente_devuelve_404(base):
    for accion in (
        lambda: productos.editar_producto(5, nombre="x", descripcion=None, imagen=None, usuario=USUARIO),
        lambda: productos.eliminar_producto(5, usuario=USUARIO),
    ):
        with pytest.raises(HTTPException) as error:
            accion()
        assert error.value.status_code == 404


def test_no_se_borran_archivos_fuera_de_la_carpeta_de_la_empresa(base):
    ajeno = base.raiz / "empresas_repo" / "9" / "ajeno.jpg"
    ajeno.parent.mkdir(parents=True)
    ajeno.write_bytes(b"de otra empresa")
    productos_empresa.eliminar_imagen(ID_EMPRESA, "empresas_repo/9/ajeno.jpg")
    productos_empresa.eliminar_imagen(ID_EMPRESA, f"empresas_repo/{ID_EMPRESA}/../9/ajeno.jpg")
    assert ajeno.exists()


# --- lectura -------------------------------------------------------------


def test_ficha_publica_trae_la_empresa_con_sus_productos(base):
    _crear(imagen=_imagen())
    ficha = landing.obtener_empresa_publica(ID_EMPRESA)
    assert ficha.nombre_empresa == "Sabores Serranos"
    assert [p.nombre for p in ficha.productos] == ["Dulce de Leche"]
    assert ficha.productos[0].imagen_url.startswith("http://api.local/empresas_repo/3/")


def test_ficha_publica_de_empresa_no_aprobada_devuelve_404(base):
    base.estado = 0
    with pytest.raises(HTTPException) as error:
        landing.obtener_empresa_publica(ID_EMPRESA)
    assert error.value.status_code == 404


def test_ficha_publica_de_empresa_con_json_incompleto_devuelve_404(base):
    base.datos = {"rubro": "Agroindustria", "ubicacion": {"zona": "Centro", "departamento": "Capital"}}
    with pytest.raises(HTTPException) as error:
        landing.obtener_empresa_publica(ID_EMPRESA)
    assert error.value.status_code == 404
    assert landing.listar_empresas_publicas(FiltrosEmpresa()) == []


def test_empresa_sin_productos_devuelve_lista_vacia(base):
    assert landing.obtener_empresa_publica(ID_EMPRESA).productos == []
    assert productos.listar_mis_productos(usuario=USUARIO) == []


def test_mi_empresa_incluye_los_productos():
    datos = {**DATOS_EMPRESA, "productos": {"2": {"id": 2, "nombre": "Miel", "descripcion": "Pura", "ubicacion_imagen": None}}}
    respuesta = empresas._fila_a_response((ID_EMPRESA, 30712345678, "Sabores Serranos SRL", datos, 7, 1, None))
    assert [(p.id, p.nombre) for p in respuesta.productos] == [(2, "Miel")]


# --- archivo JSON de la vidriera -----------------------------------------


def _archivo(base):
    return json.loads((base.raiz / "empresas_repo" / "empresas.json").read_text(encoding="utf-8"))


def test_si_el_archivo_no_esta_la_primera_lectura_lo_arma_desde_oracle(base):
    assert not (base.raiz / "empresas_repo" / "empresas.json").exists()
    assert [fila[0] for fila in vidriera_json.empresas_publicas()] == [ID_EMPRESA]
    documento = _archivo(base)["empresas"][str(ID_EMPRESA)]
    assert documento == {**DATOS_EMPRESA, "id_empresa": ID_EMPRESA, "razon_social": "Sabores Serranos SRL"}


def test_con_el_archivo_armado_la_vidriera_no_consulta_oracle(base):
    landing.listar_empresas_publicas(FiltrosEmpresa())
    consultas = base.consultas
    landing.listar_empresas_publicas(FiltrosEmpresa())
    landing.obtener_empresa_publica(ID_EMPRESA)
    assert base.consultas == consultas


def test_el_archivo_sigue_sirviendo_aunque_oracle_no_responda(base, monkeypatch):
    landing.listar_empresas_publicas(FiltrosEmpresa())

    def caida(*_, **__):
        raise RuntimeError("sin conexión")

    monkeypatch.setattr(vidriera_json, "execute_query", caida)
    assert len(landing.listar_empresas_publicas(FiltrosEmpresa())) == 1


def test_un_archivo_danado_se_regenera(base):
    archivo = base.raiz / "empresas_repo" / "empresas.json"
    archivo.parent.mkdir(parents=True)
    archivo.write_text("{ esto no es json", encoding="utf-8")
    assert len(vidriera_json.empresas_publicas()) == 1
    assert str(ID_EMPRESA) in _archivo(base)["empresas"]


def test_cada_cambio_de_productos_actualiza_el_archivo(base):
    vidriera_json.leer()
    _crear()
    assert list(_archivo(base)["empresas"][str(ID_EMPRESA)]["productos"]) == ["1"]
    productos.editar_producto(1, nombre="Miel", descripcion=None, imagen=None, usuario=USUARIO)
    assert _archivo(base)["empresas"][str(ID_EMPRESA)]["productos"]["1"]["nombre"] == "Miel"
    productos.eliminar_producto(1, usuario=USUARIO)
    assert _archivo(base)["empresas"][str(ID_EMPRESA)]["productos"] == {}


def test_una_empresa_que_deja_de_estar_aprobada_sale_del_archivo(base):
    vidriera_json.leer()
    base.estado = 2
    vidriera_json.actualizar()
    assert _archivo(base)["empresas"] == {}
    assert vidriera_json.empresa_publica(ID_EMPRESA) is None


def test_si_falla_la_actualizacion_se_borra_el_archivo_para_no_servir_datos_viejos(base, monkeypatch):
    vidriera_json.leer()

    def caida(*_, **__):
        raise RuntimeError("sin conexión")

    monkeypatch.setattr(vidriera_json, "execute_query", caida)
    vidriera_json.actualizar()
    assert not (base.raiz / "empresas_repo" / "empresas.json").exists()


@pytest.mark.parametrize(
    "filtros, encuentra",
    [
        (FiltrosEmpresa(), True),
        (FiltrosEmpresa(texto="SERRANOS"), True),
        (FiltrosEmpresa(texto="srl"), True),
        (FiltrosEmpresa(texto="inexistente"), False),
        (FiltrosEmpresa(rubro="AGROALIMENTO", zona="Zona 5", departamento="CALAMUCHITA"), True),
        (FiltrosEmpresa(rubro="AGTECH"), False),
        (FiltrosEmpresa(departamento="CAPITAL"), False),
    ],
)
def test_filtros_del_listado_publico(base, filtros, encuentra):
    assert bool(landing.listar_empresas_publicas(filtros)) is encuentra


def test_los_numeros_de_oracle_se_pueden_volver_a_guardar(base):
    # Oracle entrega latitud, número e ids como Decimal: el alta de un segundo
    # producto relee el JSON, lo modifica y lo tiene que poder escribir.
    _crear()
    segundo = _crear(nombre="Miel")
    assert segundo.id == 2
    assert base.datos["ubicacion"] == DATOS_EMPRESA["ubicacion"]
    assert type(base.datos["productos"]["1"]["id"]) is int
