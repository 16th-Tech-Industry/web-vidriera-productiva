"""
Pruebas del buscador de empresas (api/v1/servicios/busqueda_empresas.py) y
de la paginación (api/v1/servicios/paginacion.py).

Solo prueban la parte que NO toca la base: cómo se traducen los filtros a
SQL y cómo se calculan las páginas. No necesitan Oracle ni levantar el server.
"""
from api.v1.servicios.busqueda_empresas import FiltrosEmpresa, armar_where
from api.v1.servicios.paginacion import Paginacion, armar_pagina


def test_sin_filtros_no_hay_where():
    assert armar_where(FiltrosEmpresa()) == ("", {})


def test_un_solo_filtro():
    where, binds = armar_where(FiltrosEmpresa(rubro="AGTECH"))
    assert where == " WHERE rubro_vc = :f_rubro"
    assert binds == {"f_rubro": "AGTECH"}


def test_filtros_combinados_se_unen_con_and():
    where, binds = armar_where(
        FiltrosEmpresa(texto="Agro", rubro="AGTECH", zona="Zona 1", departamento="CAPITAL", estado=1)
    )
    assert where.count(" AND ") == 4
    assert binds == {
        "f_texto": "%agro%",
        "f_rubro": "AGTECH",
        "f_zona": "Zona 1",
        "f_departamento": "CAPITAL",
        "f_estado": 1,
    }


def test_estado_cero_pendiente_no_se_ignora():
    where, binds = armar_where(FiltrosEmpresa(estado=0))
    assert where == " WHERE estado = :f_estado"
    assert binds == {"f_estado": 0}


def test_texto_busca_en_razon_social_y_nombre():
    where, _ = armar_where(FiltrosEmpresa(texto="serranos"))
    assert "LOWER(razon_social) LIKE :f_texto" in where
    assert "$.nombre_empresa" in where


def test_texto_escapa_los_comodines_de_like():
    _, binds = armar_where(FiltrosEmpresa(texto="100%_real"))
    assert binds["f_texto"] == "%100\\%\\_real%"


def test_texto_solo_espacios_se_ignora():
    assert armar_where(FiltrosEmpresa(texto="   ")) == ("", {})


def test_el_valor_del_usuario_nunca_se_concatena_en_el_sql():
    where, _ = armar_where(FiltrosEmpresa(rubro="x' OR '1'='1", texto="'; DROP TABLE empresas --"))
    assert "DROP" not in where and "1'='1" not in where


def test_paginacion_calcula_offset():
    assert Paginacion(pagina=1, por_pagina=10).offset == 0
    assert Paginacion(pagina=3, por_pagina=10).binds() == {"pag_offset": 20, "pag_limite": 10}


def test_armar_pagina_calcula_cantidad_de_paginas():
    assert armar_pagina([], 0, Paginacion())["paginas"] == 0
    assert armar_pagina([1], 10, Paginacion(por_pagina=10))["paginas"] == 1
    pagina = armar_pagina([1], 11, Paginacion(pagina=2, por_pagina=10))
    assert pagina == {"items": [1], "total": 11, "pagina": 2, "por_pagina": 10, "paginas": 2}
