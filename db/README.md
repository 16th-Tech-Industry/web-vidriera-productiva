# Base de datos

Scripts, datos y documentación de la base del proyecto: PostgreSQL 15 o
superior (en producción, el servicio PostgreSQL de Railway).

Hasta octubre de 2026 la base fue Oracle; esa versión de los scripts y del
backend quedó en el tag `oracle-final` de git.

- [Archivos de este directorio](#archivos-de-este-directorio)
- [Crear la base y conectarse](#crear-la-base-y-conectarse)
- [Decisiones de motor y performance](#decisiones-de-motor-y-performance)

## Archivos de este directorio

| Archivo | Para qué sirve |
|---|---|
| `esquema.sql` | Crea las 9 tablas: `representates`, `zonas`, `departamentos`, `localidades`, `imagenes`, `empresas`, `noticias`, `eventos` y `postulaciones`, con sus índices. Se corre primero |
| `insert_geografia.sql` | Carga las 7 zonas, 26 departamentos y 1.418 localidades de Córdoba. Después de `esquema.sql` |
| `generar_sql.py` + `Dptos_Loc.xlsx` | Generan `insert_geografia.sql` a partir de la planilla de departamentos y localidades |
| `empresas.json` | Ejemplo del documento JSON que se guarda en `empresas.datos_publico` |

Fuente de los datos de geografía: [Conocé Córdoba — datos estadísticos de la Provincia](https://datosestadistica.cba.gov.ar/dataset/conoce-cordoba).

## Crear la base y conectarse

### 1. La base

- **Railway:** en el proyecto, *New → Database → PostgreSQL*. Railway crea la
  base y le pasa al backend la variable `DATABASE_URL`.
- **Local:** cualquier PostgreSQL 15 o superior. Con Docker alcanza con:
  ```bash
  docker run -d --name vidriera-postgres -e POSTGRES_USER=vidriera \
    -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=vidriera \
    -p 5432:5432 -v vidriera-postgres:/var/lib/postgresql/data postgres:17-alpine
  ```
  El volumen `vidriera-postgres` conserva los datos al apagar el contenedor.

### 2. El backend

En el `.env` de la raíz va la URL de conexión (ver `.envexample`):

```
DATABASE_URL=postgresql://vidriera:<password>@localhost:5432/vidriera
```

En Railway no hace falta: la variable la define el servicio PostgreSQL.

### 3. Crear las tablas y cargar la geografía

Con `psql` (en Railway, la URL está en la pestaña *Connect* del servicio):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/esquema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/insert_geografia.sql
```

También se puede abrir cada archivo en DBeaver (*New Database Connection →
PostgreSQL*, con host, puerto, base, usuario y password de la URL) y
ejecutarlo como script (Alt+X).

`insert_geografia.sql` fija los ids a mano, así que al final adelanta los
contadores de las columnas identidad; sin eso, la próxima fila insertada sin
id chocaría con una existente.

### 4. Arrancar de cero

Borra todas las tablas y sus datos:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Después repetir el paso 3.

## Decisiones de motor y performance

### Relacional con documentos JSON, sin una base NoSQL aparte

El sitio muestra del orden de 100 empresas o más en un mapa y un listado,
filtrables por rubro y geolocalización. Con 100 a 10.000 filas, cualquier
motor relacional con índices razonables responde en milisegundos. Una base
NoSQL no resolvería un problema de velocidad (no lo hay a este volumen) y
sumaría una segunda base que mantener sincronizada con usuarios y geografía,
otro conector en el backend y otro servicio que desplegar.

PostgreSQL da lo que se buscaría en una base de documentos:
`empresas.datos_publico` es una columna `jsonb` (formato binario),
consultable con `->`/`->>` y rutas JSON, e indexable. Es un modelo híbrido:
relacional para lo que tiene relaciones claras (usuarios, geografía, eventos
y postulaciones) y documento para el perfil público de cada empresa.

### Validación del documento en la base

El backend valida el documento con Pydantic antes de guardarlo. Además, la
tabla tiene la restricción `ck_empresas_documento`, que rechaza documentos
sin los campos obligatorios, con coordenadas fuera de rango o con productos
sin nombre. Probado sobre PostgreSQL 17:

| Documento | Resultado |
| :--- | :--- |
| Empresa completa con un producto | Válido |
| Empresa sin productos | Válido |
| Sin `correo_empresa` | Rechazado |
| Latitud fuera de rango (120) | Rechazado |
| Producto sin `nombre` | Rechazado |

### Dónde estaba el riesgo real de velocidad (y qué se hizo)

El motor nunca fue el cuello de botella. Estos son los puntos que sí pesan en
la velocidad de carga.

#### 1. Conexión nueva por consulta → pool de conexiones

Abrir una conexión por consulta (TCP + autenticación) es, para una consulta
que devuelve pocas filas, más lento que la consulta en sí. `db_connector.py`
usa un pool (`psycopg_pool.ConnectionPool`) creado una sola vez: cada
consulta toma una conexión ya abierta y la devuelve al terminar. Tamaño
configurable con `DB_POOL_MIN` y `DB_POOL_MAX` (por defecto 2 y 10). El pool
se cierra al apagar el backend (`lifespan` en `backend/main.py`).

#### 2. Filtros sobre el documento → columnas generadas con índice

Los filtros del buscador del admin y del mapa público (rubro, zona,
departamento) caen dentro de `datos_publico`. Sin índice, cada consulta
tendría que leer el documento de cada fila.

La tabla `empresas` tiene columnas generadas (`rubro_vc`, `zona_vc`,
`departamento_vc`) que la base calcula a partir del documento al guardar, con
índices B-tree, más uno combinado `departamento_vc + rubro_vc` para el filtro
típico "departamento X y rubro Y". No se escriben a mano: `datos_publico`
sigue siendo la única fuente de verdad y no se desincronizan.

#### 3. Consultar la base en cada carga de página → archivo JSON de la vidriera

El listado público cambia poco (una empresa entra o sale cuando un admin la
aprueba o rechaza, y sus productos cuando el representante los edita), así
que no conviene consultar la base en cada carga de página.

`GET /api/v1/landing/empresas` y `GET /api/v1/landing/empresas/{id}` leen de
un archivo, `backend/empresas_repo/empresas.json`, que contiene el documento
de cada empresa aprobada con sus productos
(`backend/api/v1/servicios/vidriera_json.py`). La base sigue siendo la fuente
de verdad y el respaldo; el archivo se regenera entero desde la tabla:

- cuando un admin aprueba o rechaza una empresa;
- cuando un representante agrega, edita o borra un producto;
- cuando el archivo no se encuentra o está dañado (lo arma la primera
  lectura).

En una prueba local con Oracle, la consulta que arma el archivo tardó 0,19 s
y las siguientes, ya leyendo el archivo, 0,003 s.

Limitación: un cambio hecho directo en la base (por ejemplo desde DBeaver o
`psql`) no regenera el archivo. Para que la vidriera lo tome hay que borrarlo.

### Productos dentro del JSON de la empresa

Los productos de cada empresa se guardan adentro de `empresas.datos_publico`,
en la clave `productos`: un diccionario cuya clave es el id del producto y
cuyo valor tiene `id`, `nombre`, `descripcion` e `id_imagen` (ver el
ejemplo en `empresas.json`). No hay tabla `productos`.

Es el criterio de diseño de una base de documentos: se guarda junto lo que
se lee junto. La ficha de una empresa necesita siempre sus productos, así
que salen en la misma lectura por clave primaria, sin join ni segunda
consulta.

Lo que queda afuera del documento son las imágenes: van a la tabla
`imagenes` y el JSON guarda solo su id. Así el documento se mantiene chico
(texto) y el navegador puede cachear cada imagen por separado.

### Imágenes en la base

Las imágenes de noticias y productos se guardan en la tabla `imagenes`
(contenido `bytea` y tipo), no en disco. En Railway un volumen se monta en un
solo servicio, así que el backend no puede usar el de PostgreSQL; guardándolas
en la base quedan en ese mismo volumen, se respaldan con el resto de los datos
y el backend no necesita disco propio. El backend las sirve en
`GET /api/v1/imagenes/{id}` con caché larga: una imagen no se modifica,
reemplazarla crea otra con otro id. Límite: 5 MB por imagen. El backend limita a 50 productos por empresa
para que el documento no crezca sin tope.

## Resumen

| Punto | Estado |
|---|---|
| Motor relacional con documentos `jsonb` | PostgreSQL (antes Oracle, tag `oracle-final`) |
| Pool de conexiones en `db_connector.py` | ✅ `psycopg_pool` |
| Índices para filtros de `empresas` (rubro/zona/departamento) | ✅ Columnas generadas en `esquema.sql` |
| Validación del documento en la base | ✅ `ck_empresas_documento` |
| Listado público sin consultar la base en cada carga | ✅ Archivo `empresas_repo/empresas.json`, regenerado desde la tabla |
| Productos embebidos en `empresas.datos_publico` | ✅ `backend/api/v1/servicios/productos_empresa.py` |
| Imágenes de noticias y productos en la base | ✅ Tabla `imagenes`, servidas en `/api/v1/imagenes/{id}` |
