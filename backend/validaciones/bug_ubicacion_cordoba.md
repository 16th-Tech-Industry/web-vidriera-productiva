# Bug: punto fuera de Córdoba en el alta de empresa

**Issue:** [#31 — Bug_06 Error 422 / ORA-00904 al registrar una empresa](https://github.com/16th-Tech-Industry/web-vidriera-productiva/issues/31) · etiqueta `bug` · milestone Sprint 4 · cerrado el 15/10/2026

**Test que lo respalda:** `test_rechaza_un_punto_fuera_de_cordoba` en
[`test_ubicacion_empresa.py`](test_ubicacion_empresa.py)

## Qué pasaba

Al dar de alta una empresa, el usuario marca su ubicación en un mapa. El mapa
dejaba hacer clic en provincias vecinas, pero el backend solo acepta puntos
dentro de Córdoba. Resultado: el formulario fallaba con un **422** sin decir qué
dato estaba mal.

**Pasos para reproducirlo (antes del arreglo):**

1. Entrar a "Alta de empresa".
2. En el mapa, hacer clic en una provincia vecina.
3. Enviar el formulario → 422.

## La regla

La ubicación tiene que caer dentro del rectángulo que contiene a Córdoba
(`backend/api/v1/schemas/empresas.py`, `UbicacionEmpresaAlta`):

| | Mínimo | Máximo |
|---|---|---|
| Latitud | -35.05 | -29.50 |
| Longitud | -65.80 | -61.70 |

La valida Pydantic **antes de tocar la base**. Solo se exige en el alta: una
empresa ya guardada con un valor viejo se sigue pudiendo mostrar.

## El arreglo

- **Commit `ea9ec86` (14/10):** el alta deja de mandar coordenadas fijas, el
  usuario marca el punto en el mapa y el backend valida que caiga en Córdoba.
  Se agregan los tests.
- **Commit `2ea8fe4` (15/10):**
  - El mapa (`SelectorUbicacion.tsx`) ignora los clics fuera de Córdoba, avisa
    y marca con un recuadro la zona válida.
  - Si igual llega un 422, el formulario dice qué dato corregir.

## El test

```python
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
```

**Cómo explicarlo:**

- **Qué prueba:** que no se pueda dar de alta una empresa ubicada fuera de
  Córdoba.
- **Cómo:** arma una empresa válida (`_alta`), le cambia solo las coordenadas y
  verifica que Pydantic la rechace (`ValidationError`).
- **Por qué 4 casos:** es el mismo test corrido con 4 datos (`parametrize`),
  cada uno un error típico: coordenadas al revés, otra provincia (Buenos Aires),
  una provincia vecina (Salta) y el (0, 0) de "no se marcó nada".
- **Técnica:** clases de equivalencia inválidas.
- **Su contraparte:** `test_acepta_un_punto_en_cordoba` comprueba que un punto
  válido (Amboy, Calamuchita: -32.17, -64.57) sí se acepta.

## Cómo correrlo

No necesita base ni servidor.

```bash
cd backend
./.venv/bin/python -m pytest validaciones/test_ubicacion_empresa.py -v
```

Última corrida (27/10/2026): 4/4 casos de `test_rechaza_un_punto_fuera_de_cordoba` en verde.
