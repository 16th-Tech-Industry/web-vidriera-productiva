# Backend — Vidriera Productiva

API en FastAPI para el registro/login de representantes de empresas, contra una DB Oracle (`freepdb1`, schema `cba_vidriera`, tabla `representates`).

## Estructura de carpetas

```
backend/
├── main.py                        # Entrypoint FastAPI: monta CORS y el router de la v1
├── db_connector.py                # Conexión a Oracle (execute_query: SELECT/INSERT/UPDATE/DELETE)
├── security.py                    # Hashing de passwords (bcrypt) y firma/verificación de JWT (get_current_user/require_admin)
└── api/
    └── v1/
        ├── router.py               # Arma el router de la v1, incluye todos los sub-routers de abajo
        ├── endpoints/
        │   ├── user.py                 # CRUD de usuarios (id, listar, patch, delete) — todavía MOCK, no lee/escribe la DB
        │   ├── noticias.py             # CRUD de noticias con imagen, exclusivo admin (require_admin)
        │   ├── landing.py              # Vista pública "mapa": productores/eventos MOCK + GET /landing/empresas (real, filtrable por rubro)
        │   ├── usuario/
        │   │   ├── register.py         # Registro de cuentas nuevas
        │   │   └── login.py            # Login + recuperación de contraseña (forgot/reset)
        │   └── dashboard/
        │       ├── empresas.py             # Alta y consulta de "mi empresa" — cualquier representante logueado (get_current_user)
        │       └── empresas_revision.py    # Revisión (listar pendientes, aprobar, rechazar) — exclusivo admin (require_admin)
        └── schemas/
            ├── users.py            # Modelos Pydantic de usuarios/login/registro
            ├── noticias.py         # Modelos Pydantic de noticias
            ├── landing.py          # Modelos Pydantic de productores/eventos (mock)
            └── empresas.py         # Modelos Pydantic de empresas: alta, respuesta interna y respuesta pública
```

Fuera de `backend/` pero relevante:
- `../.env` — credenciales de conexión a Oracle y clave de firma de JWT (no versionado).
- `../db/bigbang.sql` — script de creación del schema `cba_vidriera` y las tablas base (`representates`, `empresas`, geografía).
- `../db/indices_empresas.sql` — columnas virtuales + índices para filtrar `empresas` por rubro/zona/departamento.
- `../db/empresas_revision.sql` — agrega el circuito de revisión a `empresas` (`estado`, `motivo_rechazo`, `id_representante`) y la `PRIMARY KEY` que le faltaba a `representates`.

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

### Pipeline de empresas: carga (usuario) → revisión (admin) → vidriera pública

Un representante carga los datos de **su** empresa (una sola por representante)
desde su dashboard. Queda `pendiente` hasta que un admin la revisa desde el
suyo: si aprueba, pasa a visible en la vidriera pública; si rechaza, queda
con un motivo para que el usuario sepa qué corregir.

Estados (`api/v1/schemas/empresas.py`): `0` pendiente · `1` aprobada · `2` rechazada.

#### `POST /api/v1/dashboard/empresas/` — dashboard usuario, requiere estar logueado
Da de alta la empresa del representante logueado (`Authorization: Bearer <token>` de cualquier rol). Nace en estado `0` (pendiente).

Request:
```json
{
  "cuit": 20123456789,
  "razon_social": "Ejemplo SA",
  "nombre_empresa": "Nombre público",
  "rubro": "AGROALIMENTO",
  "ubicacion": { "zona": "...", "departamento": "...", "localidad": "...", "calle": "...", "numero": 123, "latitud": -31.42, "longitud": -64.18 },
  "descripcion": "...",
  "correo_empresa": "contacto@ejemplo.com",
  "redes": { "numero_contacto": "+000000000", "facebook": "...", "instagram": "...", "pagina_web": "..." }
}
```
Errores: `400` si ese representante ya tiene una empresa cargada, o si el CUIT ya existe · `401` sin token · `422` si falla alguna validación.

#### `GET /api/v1/dashboard/empresas/mia` — dashboard usuario
Devuelve **la** empresa del representante logueado (objeto único, no lista — un representante tiene como máximo una) junto a su `estado` y `motivo_rechazo` si fue rechazada. `404` si todavía no cargó ninguna.

#### `GET /api/v1/dashboard/empresas/pendientes` — dashboard admin, exclusivo admin
Lista las empresas en estado pendiente, esperando revisión.

#### `PATCH /api/v1/dashboard/empresas/{id}/aprobar` — dashboard admin, exclusivo admin
Pasa la empresa a estado aprobada (visible en `/landing/empresas`) y limpia cualquier `motivo_rechazo` previo.

#### `PATCH /api/v1/dashboard/empresas/{id}/rechazar` — dashboard admin, exclusivo admin
Pasa la empresa a estado rechazada. Body: `{ "motivo_rechazo": "..." }` (obligatorio, lo ve el usuario en `GET /mia`).

Errores comunes de los tres endpoints de admin: `403` si quien llama no es admin · `404` si la empresa no existe.

### `GET /api/v1/landing/empresas` — público, sin autenticación
Empresas **aprobadas**, para el mapa/listado de la landing. Filtro opcional `?rubro=AGROALIMENTO` (usa la columna virtual `rubro_vc` de `db/indices_empresas.sql`, indexada). No expone `estado`, `motivo_rechazo`, `id_representante` ni `cuit` — son datos del circuito de revisión interno, no de cara al visitante.

## Notas

- Los tokens de recuperación de contraseña viven en memoria del proceso (`_reset_tokens` en `login.py`): se pierden si el server se reinicia y no funcionan con más de una instancia corriendo. Migrarlos a una tabla en DB es un TODO pendiente.
- El JWT no tiene revocación: un token emitido sigue siendo válido hasta que expira solo, incluso si la cuenta cambió de password después.
- CORS habilitado en `main.py` solo para `http://localhost:5173` y `http://127.0.0.1:5173` (dev server de Vite).
- `db/bigbang.sql` creaba `representates.id_representante` como `IDENTITY` pero sin `PRIMARY KEY`/`UNIQUE`. Eso bloqueaba cualquier `FOREIGN KEY` que apuntara a esa columna (`ORA-02270`) — entre ellas, la de `empresas.id_representante`. `db/empresas_revision.sql` agrega esa `PRIMARY KEY` como prerrequisito antes de tocar `empresas`.
- `db/indices_empresas.sql` (columnas virtuales `rubro_vc`/`zona_vc`/`departamento_vc`) tenía un bug latente: `JSON_VALUE` sin `RETURNING` devuelve `VARCHAR2(4000)` por default, y Oracle rechazaba declarar la columna virtual como `VARCHAR2(150)` (`ORA-12899`). Se corrigió agregando `RETURNING VARCHAR2(150)` explícito en cada `JSON_VALUE`.
- La tabla `noticias` (`db/noticias.sql`) no existe todavía en la base de `bauti_dev` contra la que se corrió esto — se deja así a propósito (es útil como caso de "bug" para el TP de testing), no confundir con un olvido.
- El endpoint de alta de empresa (`POST /dashboard/empresas/`) y el de CUIT duplicado tienen la misma condición de carrera teórica que `register.py` con el email: el chequeo "ya existe" y el `INSERT` no son atómicos porque ni `empresas.cuit` ni `representates.email_representante` tienen `UNIQUE` en la base. Bajo carga concurrente podría colarse un duplicado; queda pendiente agregar esas constraints si se lo quiere blindar de verdad.
