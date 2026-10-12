# Backend — Vidriera Productiva

API en FastAPI para el registro/login de representantes de empresas, la carga y revisión de empresas, noticias, notificaciones en vivo y mails transaccionales, contra una DB Oracle (`freepdb1`, schema `cba_vidriera`).

## Estructura de carpetas

```
backend/
├── main.py                        # Entrypoint FastAPI: monta CORS y el router de la v1
├── db_connector.py                # Conexión a Oracle (execute_query: SELECT/INSERT/UPDATE/DELETE)
├── security.py                    # Hashing de passwords (bcrypt), JWT de sesión (get_current_user/require_admin) y token de recupero de contraseña
├── requirements.txt               # Dependencias (ver "Dependencias" más abajo)
├── validaciones/                  # Pruebas automáticas con pytest (ver validaciones/README.md)
└── api/
    └── v1/
        ├── router.py               # Arma el router de la v1, incluye todos los sub-routers de abajo
        ├── endpoints/
        │   ├── user.py                 # CRUD de usuarios (id, listar, patch, delete) — todavía MOCK, no lee/escribe la DB
        │   ├── noticias.py             # CRUD de noticias con imagen, exclusivo admin (require_admin)
        │   ├── landing.py              # Vista pública "mapa": productores/eventos MOCK + empresas aprobadas (listado filtrable y ficha), leídas del archivo JSON de la vidriera
        │   ├── notificaciones.py       # WebSocket de notificaciones en vivo + envío (a todos / a usuarios específicos), exclusivo admin; aviso automático de empresa aprobada/rechazada
        │   ├── usuario/
        │   │   ├── register.py         # Registro de cuentas nuevas + mail de bienvenida
        │   │   └── login.py            # Login + recuperación de contraseña por mail (forgot/reset)
        │   └── dashboard/
        │       ├── empresas.py             # Alta y consulta de "mi empresa" — cualquier representante logueado (get_current_user)
        │       ├── productos.py            # Alta, edición y baja de los productos de "mi empresa", con imagen
        │       ├── empresas_revision.py    # Buscador y revisión (pendientes, aprobar, rechazar, con aviso al representante) — exclusivo admin (require_admin)
        │       └── empresas_exportacion.py # Exportación del listado a .xlsx por cola de trabajos — exclusivo admin
        ├── servicios/
        │   ├── correo.py               # Envío de mails por SMTP: bienvenida, recupero de contraseña y revisión de empresa
        │   ├── productos_empresa.py    # Productos dentro del JSON de la empresa e imágenes en empresas_repo/
        │   ├── vidriera_json.py        # Archivo empresas_repo/empresas.json: de donde lee la vidriera pública, regenerado desde Oracle
        │   ├── busqueda_empresas.py    # Filtros combinados del buscador de empresas
        │   ├── paginacion.py           # Paginación de listados
        │   ├── exportacion_empresas.py # Armado del .xlsx
        │   └── cola_trabajos.py        # Cola de trabajos en segundo plano, en memoria
        └── schemas/
            ├── users.py            # Modelos Pydantic de usuarios/login/registro
            ├── noticias.py         # Modelos Pydantic de noticias
            ├── landing.py          # Modelos Pydantic de productores/eventos (mock)
            ├── empresas.py         # Modelos Pydantic de empresas: alta, respuesta interna y respuesta pública
            ├── productos.py        # Modelo Pydantic de producto y forma del diccionario que se guarda en el JSON
            └── notificaciones.py   # Modelos Pydantic de notificaciones: envío a todos / a usuarios y respuesta
```

Fuera de `backend/` pero relevante:
- `../.env` — credenciales de conexión a Oracle, clave de firma de JWT y datos del servidor de correo (no versionado; la lista completa de variables está en `../.envexample`).
- `../db/bigbang.sql` — script de creación del schema `cba_vidriera` y las tablas base (`representates`, `empresas`, geografía).
- `../db/indices_empresas.sql` — columnas virtuales + índices para filtrar `empresas` por rubro/zona/departamento.
- `../db/empresas_revision.sql` — agrega el circuito de revisión a `empresas` (`estado`, `motivo_rechazo`, `id_representante`) y la `PRIMARY KEY` que le faltaba a `representates`.

`recursos/` y `.venv/` dentro de `backend/` son entornos virtuales de Python (ignorados por git), no código de la app. `uploads/` (imágenes de noticias) y `empresas_repo/` (imágenes de productos, una carpeta por empresa) guardan archivos subidos por los usuarios y tampoco se versionan.

## Dependencias

```bash
cd backend
python -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn main:app          # http://localhost:8000 · documentación en /docs
```

| Paquete | Para qué |
| :--- | :--- |
| `fastapi`, `uvicorn` | La API y el servidor que la corre. |
| `pydantic[email]` | Validación de los datos de entrada, incluido el formato de email. |
| `python-dotenv` | Lee las variables del `.env`. |
| `oracledb` | Conexión a Oracle. |
| `bcrypt` | Hash de contraseñas. |
| `PyJWT` | JWT de sesión y token de recupero de contraseña. |
| `python-multipart` | Subida de imágenes de noticias. |
| `websockets` | Notificaciones en vivo: sin este paquete uvicorn rechaza las conexiones `ws://`. |
| `openpyxl` | Exportación de empresas a `.xlsx`. |

El envío de mails no suma ningún paquete: usa `smtplib` y `email`, de la librería estándar de Python.

Para las pruebas hace falta además `pytest` (no está en `requirements.txt`): `./.venv/bin/pip install pytest` y después `./.venv/bin/python -m pytest validaciones`.

## Envío de mails

El backend manda tres mails, todos desde `api/v1/servicios/correo.py` y en segundo plano (después de responder el request):

| Mail | Cuándo sale |
| :--- | :--- |
| Bienvenida | Al registrarse (`POST /register/`). |
| Recupero de contraseña | Al pedirlo (`POST /users/forgot-password`), con un link `FRONTEND_URL/?reset_token=<token>` que abre el formulario de nueva contraseña. |
| Empresa aprobada o rechazada | Cuando el admin revisa la empresa (`PATCH /dashboard/empresas/{id}/aprobar` o `/rechazar`). |

En desarrollo se usa la casilla de pruebas de [Mailtrap](https://mailtrap.io): recibe los mails por SMTP y los muestra en su web, **sin entregarlos al destinatario real**. Para configurarlo, crear una cuenta, entrar a la casilla (Sandbox) y copiar sus datos SMTP al `.env`:

| Variable | Valor |
| :--- | :--- |
| `SMTP_HOST` | Host de la casilla (`sandbox.smtp.mailtrap.io`). Si falta, no se manda nada y queda un aviso en el log. |
| `SMTP_PORT` | Puerto (`2525`). |
| `SMTP_USER`, `SMTP_PASSWORD` | Usuario y contraseña de la casilla. |
| `MAIL_FROM` | Remitente que figura en los mails. |
| `FRONTEND_URL` | URL del frontend, para armar los links (`http://localhost:5173` en local). |

Un mail que falla nunca rompe el request que lo disparó: queda registrado en el log. El plan gratis de Mailtrap acepta más o menos un mail cada 10 segundos; ante ese rechazo se reintenta hasta 4 veces, con 5 segundos entre intentos, así que una ráfaga de varios mails seguidos puede perder alguno.

## Endpoints

### `POST /api/v1/register/`
Crea una cuenta nueva. Hashea la password con bcrypt y la persiste en `representates`. Después de responder manda el mail de bienvenida en segundo plano (`api/v1/servicios/correo.py`); si el envío falla, la cuenta queda creada igual.

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
Pide recuperar la contraseña mandando solo el email. Si es de una cuenta activa, genera un token de un solo uso (1h de vida) y lo manda por mail (`api/v1/servicios/correo.py`) con un link al frontend: `FRONTEND_URL/?reset_token=<token>`. El mail sale en segundo plano, después de responder. Necesita las variables `SMTP_*` del `.env`; si falta `SMTP_HOST` o el envío falla, queda un aviso en el log y la respuesta es la misma. La configuración y los reintentos están en "Envío de mails".

Request: `{ "email": "usuario@mail.com" }`
Response `200` (siempre igual, exista o no el email): `{ "message": "Si el email está registrado, enviamos instrucciones para recuperar la contraseña." }`

### `POST /api/v1/users/reset-password`
Cambia la contraseña usando el token recibido por mail. Errores: `400` con el mismo mensaje si el token está mal firmado, vencido o ya se usó.

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
Devuelve **la** empresa del representante logueado (objeto único, no lista — un representante tiene como máximo una) junto a su `estado`, `motivo_rechazo` si fue rechazada y sus `productos`. `404` si todavía no cargó ninguna.

#### Productos de la empresa — dashboard usuario, requiere estar logueado

Los productos no tienen tabla propia: viven **adentro del JSON de la empresa** (`empresas.datos_publico`), en la clave `productos`, como un diccionario cuya clave es el id del producto. La empresa y sus productos se leen siempre juntos, así que la ficha completa sale con una sola consulta por clave primaria.

```json
{
  "nombre_empresa": "Sabores Serranos",
  "rubro": "AGROALIMENTO",
  "ubicacion": { "...": "..." },
  "productos": {
    "1": { "id": 1, "nombre": "Dulce de Leche", "descripcion": "Artesanal", "ubicacion_imagen": "empresas_repo/7/0d68a117.png" },
    "2": { "id": 2, "nombre": "Miel", "descripcion": "Pura de monte", "ubicacion_imagen": null }
  }
}
```

Las imágenes no van a la base: se guardan en disco en `backend/empresas_repo/<id_empresa>/` con un nombre aleatorio, y el JSON guarda solo la ubicación. `main.py` sirve esa carpeta como estático, así que `ubicacion_imagen` es también la ruta de la URL (`http://localhost:8000/empresas_repo/7/0d68a117.png`).

| Endpoint | Qué hace |
| :--- | :--- |
| `GET /api/v1/dashboard/empresas/mia/productos/` | Lista los productos de mi empresa. |
| `POST /api/v1/dashboard/empresas/mia/productos/` | Agrega un producto. `multipart/form-data`: `nombre` y `descripcion` obligatorios, `imagen` opcional. Devuelve `201`. |
| `PATCH /api/v1/dashboard/empresas/mia/productos/{id}` | Edita solo los campos enviados. Una `imagen` nueva reemplaza y borra la anterior. |
| `DELETE /api/v1/dashboard/empresas/mia/productos/{id}` | Elimina el producto y su imagen. Devuelve `204`. |

Cada producto se devuelve así (la API entrega una lista ordenada por id, aunque en la base sea un diccionario):
```json
{ "id": 1, "nombre": "Dulce de Leche", "descripcion": "Artesanal", "ubicacion_imagen": "empresas_repo/7/0d68a117.png", "imagen_url": "http://localhost:8000/empresas_repo/7/0d68a117.png" }
```

Reglas: imagen `.jpg`, `.jpeg`, `.png`, `.webp` o `.gif` de hasta 5 MB · máximo 50 productos por empresa · el representante solo llega a su propia empresa (sale de su JWT) · los cambios se publican directo, sin volver a revisión. Errores: `400` formato o tamaño de imagen, o tope de productos · `404` si no cargó su empresa o el producto no existe · `422` si falta `nombre` o `descripcion`.

#### `GET /api/v1/dashboard/empresas/pendientes` — dashboard admin, exclusivo admin
Lista las empresas en estado pendiente, esperando revisión.

#### `PATCH /api/v1/dashboard/empresas/{id}/aprobar` — dashboard admin, exclusivo admin
Pasa la empresa a estado aprobada (visible en `/landing/empresas`), limpia cualquier `motivo_rechazo` previo y le avisa al representante.

#### `PATCH /api/v1/dashboard/empresas/{id}/rechazar` — dashboard admin, exclusivo admin
Pasa la empresa a estado rechazada y le avisa al representante. Body: `{ "motivo_rechazo": "..." }` (obligatorio, lo ve el usuario en `GET /mia` y en el aviso).

**Aviso al representante** (aprobar y rechazar): después de responderle al admin, salen en segundo plano un mail (`api/v1/servicios/correo.py`) y una notificación en vivo por WebSocket si tiene el dashboard abierto. Si el mail falla queda en el log y la revisión no se revierte. Repetir la misma decisión no vuelve a avisar, salvo que cambie el motivo del rechazo.

Errores comunes de los tres endpoints de admin: `403` si quien llama no es admin · `404` si la empresa no existe.

### Vidriera pública: archivo JSON regenerado desde Oracle

Los dos endpoints públicos de empresas no consultan Oracle: leen `backend/empresas_repo/empresas.json`, un archivo con el documento de cada empresa **aprobada** (datos públicos y productos). Oracle sigue siendo la fuente de verdad y el respaldo; el archivo es una copia que se puede borrar porque se vuelve a armar (`api/v1/servicios/vidriera_json.py`).

```json
{
  "actualizado": "2026-10-12T22:01:18+00:00",
  "empresas": {
    "7": { "id_empresa": 7, "razon_social": "Sabores Serranos SRL", "nombre_empresa": "Sabores Serranos", "rubro": "AGROALIMENTO", "ubicacion": { "...": "..." }, "productos": { "1": { "...": "..." } } }
  }
}
```

Se regenera entero desde la tabla `empresas`: cuando un admin aprueba o rechaza una empresa · cuando un representante agrega, edita o borra un producto · cuando el archivo no se encuentra o está dañado (lo arma la primera lectura, por ejemplo después de un despliegue). Si la regeneración falla, el cambio en Oracle no se revierte: se borra el archivo y se arma en la próxima lectura.

Para tener en cuenta: un cambio hecho directo en la base (por ejemplo desde DBeaver) no regenera el archivo; hay que borrarlo para que la vidriera lo tome. Como está dentro de `empresas_repo/`, el archivo también se puede descargar tal cual en `http://localhost:8000/empresas_repo/empresas.json` (solo contiene datos públicos).

### `GET /api/v1/landing/empresas` — público, sin autenticación
Empresas **aprobadas**, para el mapa/listado de la landing. Filtros opcionales combinables: `?texto=`, `?rubro=AGROALIMENTO`, `?zona=`, `?departamento=`. No expone `estado`, `motivo_rechazo`, `id_representante` ni `cuit` — son datos del circuito de revisión interno, no de cara al visitante. Tampoco trae los productos, para que el listado del mapa siga siendo liviano.

### `GET /api/v1/landing/empresas/{id}` — público, sin autenticación
Ficha de una empresa **aprobada**: los mismos campos que el listado más `productos` (lista, con `imagen_url` lista para un `<img>`). `404` si no existe, no está aprobada o tiene el JSON incompleto.

### Notificaciones en vivo: dashboard admin → dashboard usuario

Cada dashboard abre un WebSocket y el admin envía por REST. Las notificaciones **no se guardan** en la DB: solo las reciben los usuarios que tienen el dashboard abierto en ese momento. Las conexiones viven en memoria, así que requiere un solo worker de uvicorn.

#### `WS /api/v1/notificaciones/ws?token=<JWT>` — cualquier usuario logueado
El token va por query string (el WebSocket del navegador no deja mandar `Authorization`). Token inválido/vencido → se rechaza el handshake (`1008`). Cada notificación llega como:
```json
{ "tipo": "notificacion", "alcance": "todos", "titulo": "Aviso", "mensaje": "Texto", "fecha": "2026-09-28T21:00:00+00:00" }
```
Cuando el admin aprueba o rechaza una empresa, el representante recibe ese mismo formato con dos campos más, para que el dashboard pueda refrescar el estado sin recargar:
```json
{ "tipo": "notificacion", "alcance": "usuarios", "titulo": "Empresa rechazada", "mensaje": "Sabores SRL no fue aprobada. Motivo: Falta el logo", "fecha": "2026-10-12T18:00:00+00:00", "evento": "empresa_rechazada", "empresa_id": 7 }
```
`evento` es `empresa_aprobada` o `empresa_rechazada`.

#### `POST /api/v1/notificaciones/todos` — exclusivo admin
A todos los usuarios conectados (los admins no la reciben). Request: `{ "titulo": "Aviso", "mensaje": "Texto" }` · Response: `{ "usuarios_notificados": 5, "usuarios_sin_conexion": [] }`

#### `POST /api/v1/notificaciones/usuarios` — exclusivo admin
Solo a los `id_representante` indicados. Request: `{ "titulo": "Aviso", "mensaje": "Texto", "usuario_ids": [12, 15] }` · Response: `{ "usuarios_notificados": 1, "usuarios_sin_conexion": [15] }`

#### `GET /api/v1/notificaciones/conectados` — exclusivo admin
Ids de los usuarios con el dashboard abierto ahora.

## Notas

- Los tokens de recuperación de contraseña no se guardan en ningún lado: son JWT firmados con una clave derivada de `JWT_SECRET_KEY` (ver `security.py`) que llevan una huella de la contraseña vigente, así que dejan de servir cuando la contraseña cambia. Si se piden dos seguidos, los dos valen hasta que se use uno o pase la hora.
- El JWT no tiene revocación: un token emitido sigue siendo válido hasta que expira solo, incluso si la cuenta cambió de password después.
- CORS habilitado en `main.py` solo para `http://localhost:5173` y `http://127.0.0.1:5173` (dev server de Vite).
- `db/bigbang.sql` creaba `representates.id_representante` como `IDENTITY` pero sin `PRIMARY KEY`/`UNIQUE`. Eso bloqueaba cualquier `FOREIGN KEY` que apuntara a esa columna (`ORA-02270`) — entre ellas, la de `empresas.id_representante`. `db/empresas_revision.sql` agrega esa `PRIMARY KEY` como prerrequisito antes de tocar `empresas`.
- `db/indices_empresas.sql` (columnas virtuales `rubro_vc`/`zona_vc`/`departamento_vc`) tenía un bug latente: `JSON_VALUE` sin `RETURNING` devuelve `VARCHAR2(4000)` por default, y Oracle rechazaba declarar la columna virtual como `VARCHAR2(150)` (`ORA-12899`). Se corrigió agregando `RETURNING VARCHAR2(150)` explícito en cada `JSON_VALUE`.
- La tabla `noticias` (`db/noticias.sql`) no existe todavía en la base de `bauti_dev` contra la que se corrió esto — se deja así a propósito (es útil como caso de "bug" para el TP de testing), no confundir con un olvido.
- El endpoint de alta de empresa (`POST /dashboard/empresas/`) y el de CUIT duplicado tienen la misma condición de carrera teórica que `register.py` con el email: el chequeo "ya existe" y el `INSERT` no son atómicos porque ni `empresas.cuit` ni `representates.email_representante` tienen `UNIQUE` en la base. Bajo carga concurrente podría colarse un duplicado; queda pendiente agregar esas constraints si se lo quiere blindar de verdad.
