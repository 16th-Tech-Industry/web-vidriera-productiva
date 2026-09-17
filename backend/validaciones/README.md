# Validaciones — pruebas automáticas del Backend

Pruebas sencillas de los schemas de Pydantic usados por los endpoints de
login, registro (`backend/api/v1/schemas/users.py`) y noticias
(`backend/api/v1/schemas/noticias.py`). Pydantic valida los datos ANTES
de tocar la base de datos, así que estas pruebas **no necesitan la base
Oracle ni levantar el servidor**.

`test_esquemas_usuario.py` respalda los casos **TC-L-08…11**,
**TC-R-08…12** y **TC-RC-01…02** de la planilla de casos de prueba
(módulos Login, Registro y Recuperación de contraseña).

`test_esquemas_noticias.py` cubre las reglas de título/cuerpo del nuevo
módulo de Gestión de Noticias (no está en la planilla original).

## Cómo ejecutar

Requisito: el entorno virtual del backend con `pytest` y `email-validator`.

```bash
cd backend
./recursos/bin/pip install pytest email-validator   # si faltan
./recursos/bin/python -m pytest validaciones -v
```

Resultado esperado: todas las pruebas en verde. La última corrida de
`test_esquemas_usuario.py` quedó guardada en `backend_pytest.txt`.
