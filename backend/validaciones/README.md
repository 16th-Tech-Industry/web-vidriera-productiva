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

`test_correos.py` cubre los mails transaccionales: el token de recuperación,
los endpoints `forgot-password` / `reset-password`, el mail de bienvenida
del registro y el envío, con la base y el SMTP reemplazados por dobles.

`test_productos.py` cubre los productos de una empresa: el diccionario que
se guarda dentro del JSON, las imágenes en `empresas_repo/` (en una carpeta
temporal) y los endpoints del dashboard y de la ficha pública.

## Cómo ejecutar

Requisito: el entorno virtual del backend (`.venv`) con las dependencias de
`requirements.txt` y `pytest`.

```bash
cd backend
./.venv/bin/pip install -r requirements.txt pytest   # si faltan
./.venv/bin/python -m pytest validaciones -v
```

Resultado esperado: todas las pruebas en verde. La última corrida de
`test_esquemas_usuario.py` quedó guardada en `backend_pytest.txt`.
