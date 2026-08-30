# Backend — Vidriera Productiva

API en FastAPI para el registro/login de representantes de empresas, contra una DB Oracle (`freepdb1`, schema `cba_vidriera`, tabla `representates`).

## Estructura de carpetas

```
backend/
├── main.py                        # Entrypoint FastAPI: monta CORS y el router de la v1
├── db_connector.py                # Conexión a Oracle (execute_query: SELECT/INSERT/UPDATE/DELETE)
├── security.py                    # Hashing de passwords (bcrypt) y firma/verificación de JWT
└── api/
    └── v1/
        ├── router.py               # Arma el router de la v1, incluye los sub-routers de abajo
        ├── endpoints/
        │   ├── user.py                 # CRUD de usuarios (id, listar, patch, delete) — todavía MOCK, no lee/escribe la DB
        │   └── usuario/
        │       ├── register.py         # Registro de cuentas nuevas
        │       └── login.py            # Login + recuperación de contraseña (forgot/reset)
        └── schemas/
            └── users.py            # Modelos Pydantic de entrada/salida (request/response)
```

Fuera de `backend/` pero relevante:
- `../.env` — credenciales de conexión a Oracle y clave de firma de JWT (no versionado).
- `../db/bigbang.sql` — script de creación del schema `cba_vidriera` y la tabla `representates`.

`recursos/` y `.venv/` dentro de `backend/` son entornos virtuales de Python (ignorados por git), no código de la app.

## Endpoints

### `POST /api/v1/register/`
Crea una cuenta nueva. Hashea la password con bcrypt y la persiste en `representates`.

Request:
```json
{ "email": "usuario@mail.com", "name": "Nombre", "apellido": "Apellido", "password": "minimo8caracteres" }
```
Response `201`:
```json
{ "id": 23, "email": "usuario@mail.com", "name": "Nombre", "is_active": true }
```
Errores: `400` si el email ya está registrado · `422` si falla alguna validación.

### `POST /api/v1/users/login`
Valida email + password contra la DB y devuelve un JWT de sesión (expira en `JWT_EXPIRE_MINUTES`, default 60 min).

Request:
```json
{ "email": "usuario@mail.com", "password": "minimo8caracteres" }
```
Response `200`:
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```
Errores: `401` con el mismo mensaje genérico si el email no existe o la password es incorrecta (evita user enumeration) · `403` si la cuenta está inactiva (`estado != 1`).

### `POST /api/v1/users/forgot-password`
Pide recuperar la contraseña mandando solo el email. Genera un token de un solo uso (1h de vida) y lo entrega — hoy por consola (`print`), simulando el mail real que todavía no existe.

Request: `{ "email": "usuario@mail.com" }`
Response `200` (siempre igual, exista o no el email): `{ "message": "Si el email está registrado, enviamos instrucciones para recuperar la contraseña." }`

### `POST /api/v1/users/reset-password`
Cambia la contraseña usando el token recibido en `forgot-password`.

Request:
```json
{ "token": "el-token-recibido", "new_password": "nuevaClave123" }
```
Response `200`: `{ "message": "Contraseña actualizada correctamente" }`
Error `400`: token inválido, ya usado o vencido.

### `GET /api/v1/users/` · `GET /api/v1/users/{id}` · `PATCH /api/v1/users/{id}` · `DELETE /api/v1/users/{id}`
CRUD de usuarios. **Mock**: devuelven datos simulados, no leen/escriben la DB todavía (`endpoints/user.py`).

## Notas

- Los tokens de recuperación de contraseña viven en memoria del proceso (`_reset_tokens` en `login.py`): se pierden si el server se reinicia y no funcionan con más de una instancia corriendo. Migrarlos a una tabla en DB es un TODO pendiente.
- El JWT no tiene revocación: un token emitido sigue siendo válido hasta que expira solo, incluso si la cuenta cambió de password después.
- CORS habilitado en `main.py` solo para `http://localhost:5173` y `http://127.0.0.1:5173` (dev server de Vite).
