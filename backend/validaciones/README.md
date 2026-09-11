# Validaciones — pruebas automáticas del Backend

Pruebas sencillas de los schemas de Pydantic usados por los endpoints de
login y registro (`backend/api/v1/schemas/users.py`). Pydantic valida el
JSON que llega ANTES de tocar la base de datos, así que estas pruebas
**no necesitan la base Oracle ni levantar el servidor**.

Respaldan los casos **TC-L-08…11**, **TC-R-08…12** y **TC-RC-01…02** de la
planilla de casos de prueba (módulos Login, Registro y Recuperación de
contraseña).

## Cómo ejecutar

Requisito: el entorno virtual del backend con `pytest` y `email-validator`.

```bash
cd backend
./recursos/bin/pip install pytest email-validator   # si faltan
./recursos/bin/python -m pytest validaciones -v
```

Resultado esperado: **11/11 pruebas en verde**. La última corrida quedó
guardada en `backend_pytest.txt`.
