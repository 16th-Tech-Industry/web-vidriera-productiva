# Base de datos

Scripts, datos y documentación de la base del proyecto (Oracle Database
Free 23ai, esquema `cba_vidriera`).

- [Archivos de este directorio](#archivos-de-este-directorio)
- [Conexión con DBeaver y carga desde cero](#conexión-con-dbeaver-y-carga-desde-cero)
- [Decisiones de motor y performance](#decisiones-de-motor-y-performance)

## Archivos de este directorio

| Archivo | Para qué sirve |
|---|---|
| `bigbang.sql` | Crea el usuario `cba_vidriera` y las tablas base (`representates`, `empresas`, `zonas`, `departamentos`, `localidades`). Se corre primero (ver la sección de conexión) |
| `empresas_revision.sql` | Circuito de revisión de empresas (estado y motivo de rechazo) y la `PRIMARY KEY` que le faltaba a `representates`. Después de `bigbang.sql` |
| `indices_empresas.sql` | Columnas virtuales e índices para filtrar empresas por rubro, zona y departamento. Después de `bigbang.sql` |
| `noticias.sql` | Tabla `noticias` (sección Novedades y gestión de noticias del admin) |
| `insert_geografia.sql` | Carga de zonas, departamentos y localidades de Córdoba |
| `generar_sql.py` + `Dptos_Loc.xlsx` | Generan `insert_geografia.sql` a partir de la planilla de departamentos y localidades |
| `empresas.json` | Ejemplo del documento JSON que se guarda en `empresas.datos_publico` |

Fuente de los datos de geografía: [Conocé Córdoba — datos estadísticos de la Provincia](https://datosestadistica.cba.gov.ar/dataset/conoce-cordoba).

## Conexión con DBeaver y carga desde cero

Guía para conectarse a la instancia Oracle Database Free 23ai del proyecto y volver a correr `bigbang.sql` desde cero si hace falta.

### 1. Datos de conexión

| Dato | Valor |
|---|---|
| Host | ver `.env` (`DB_CONNECTION`) |
| Puerto | `1521` (default, no hace falta especificarlo) |
| Service name (CDB root) | `free` |
| Service name (PDB) | `freepdb1` |
| Usuario admin | `PDBADMIN` |

**Las credenciales oficiales (host, usuarios, passwords) viven únicamente en el `.env` de la raíz del proyecto** (`DB_USER`, `DB_CONNECTION`, `PASSWORD`) — no se versionan por seguridad y no se repiten en este manual. Pedí acceso a ese archivo a quien administre el proyecto si no lo tenés.

**Importante:** siempre hay que conectarse contra el service name **`freepdb1`** (el PDB), nunca contra `free` (el CDB root). Si te conectás contra `free`, cualquier `CREATE USER` va a fallar con `ORA-65096: common user or role name must start with prefix C##`.

### 2. Crear las dos conexiones en DBeaver

Este script necesita **dos conexiones distintas** porque crea un usuario nuevo y después opera con ese usuario — DBeaver no permite cambiar de usuario a mitad de una sesión con `CONNECT` (eso es un comando de SQL\*Plus, no SQL válido).

#### Conexión A — Admin (`PDBADMIN`)

1. Database → New Database Connection → Oracle.
2. Host y puerto: los del `.env` (`DB_CONNECTION`).
3. Service name: `freepdb1` (**no** `free`).
4. Usuario: `PDBADMIN` / password del `.env` (`PASSWORD`).
5. Test Connection → Finish.

Se usa para: crear el usuario `cba_vidriera` y darle permisos (líneas 1-9 de `bigbang.sql`).

#### Conexión B — Aplicación (`cba_vidriera`)

1. Database → New Database Connection → Oracle.
2. Host y puerto: los mismos que la Conexión A.
3. Service name: `freepdb1`.
4. Usuario: `cba_vidriera` / la password definida en el `CREATE USER` de `bigbang.sql`.
5. Test Connection → Finish.

Se usa para: crear las tablas (`representates`, `empresas`, `zonas`, `departamentos`, `localidades`).

Esta conexión solo va a funcionar **después** de correr la Conexión A al menos una vez (el usuario tiene que existir primero).

### 3. Ejecutar `bigbang.sql` de cero

1. Abrí `bigbang.sql` con la **Conexión A** (`PDBADMIN`) activa.
2. Seleccioná y ejecutá solo el bloque de creación de usuario (la password real está en `bigbang.sql`, no se repite acá):
   ```sql
   CREATE USER cba_vidriera IDENTIFIED BY "<password>"
   DEFAULT TABLESPACE users TEMPORARY TABLESPACE temp;

   GRANT CONNECT, RESOURCE TO cba_vidriera;

   ALTER USER cba_vidriera QUOTA UNLIMITED ON users;
   ```
3. Cambiá a la **Conexión B** (`cba_vidriera`) en DBeaver (selector de conexión arriba del editor SQL, o abrí el script en una pestaña nueva apuntando a esa conexión).
4. Ejecutá el resto del script (todos los `CREATE TABLE`) desde ahí.

Si por error corrés los `CREATE TABLE` estando todavía conectado como `PDBADMIN`, las tablas se crean igual pero quedan en el tablespace `SYSTEM` (el default de `PDBADMIN`), lo que rompe la tabla `empresas` porque su columna `JSON` requiere un tablespace con ASSM (`USERS`, no `SYSTEM`). Ver troubleshooting abajo.

### 4. Errores que ya nos salieron (troubleshooting)

| Error | Causa | Solución |
|---|---|---|
| `ORA-65096: common user or role name must start with prefix C##` | La conexión apunta al CDB root (`free`) en vez del PDB (`freepdb1`) | Reconfigurar el service name de la conexión a `freepdb1` |
| `ORA-00900: invalid SQL statement` | El script tenía un `CONNECT usuario/pass` — comando de SQL\*Plus, inválido en DBeaver | Usar dos conexiones separadas (ver sección 2) en vez de `CONNECT` |
| `ORA-03061: Precision cannot be specified for data type INT` | Columnas definidas como `INT(1)` — sintaxis de MySQL, no válida en Oracle | Usar `NUMBER(1)` en vez de `INT(1)` |
| `ORA-00931: missing identifier` / `ORA-03078: unexpected right parenthesis after ,` | Coma colgante antes del `)` de cierre en un `CREATE TABLE` | Sacar la coma de la última columna definida |
| `ORA-43853: JSON type cannot be used in non-automatic segment space management tablespace "SYSTEM"` | La tabla con columna `JSON` (`empresas`) se creó estando conectado como `PDBADMIN` (default tablespace `SYSTEM`, sin ASSM) en vez de `cba_vidriera` (default tablespace `USERS`) | Ejecutar los `CREATE TABLE` con la Conexión B (`cba_vidriera`) activa |

### 5. Si hay que arrancar de cero (limpiar todo)

Conectado como `PDBADMIN`:

```sql
DROP USER cba_vidriera CASCADE;
```

Esto borra el usuario y todas sus tablas de una. Después repetir desde el paso 3.

## Decisiones de motor y performance

Esta sección responde una pregunta que surgió sobre el proyecto:
**¿Oracle (relacional) aguanta el volumen de consultas del sitio, o
convendría pasar a una base no relacional (NoSQL) para que los datos de
las empresas carguen rápido en la web?**

### Contexto

- Motor: Oracle Database (`gvenzl/oracle-free:23-slim`, ver
  `docker-compose.yml`), con soporte nativo de tipo `JSON` desde 21c.
- Tablas: `representates`, `empresas` (con `datos_publico JSON`),
  `zonas`, `departamentos`, `localidades` (ver `bigbang.sql`).
- Volumen esperado: el "expositor digital" público muestra del orden
  de 100 empresas o más en un mapa/listado, filtrable por rubro y por
  geolocalización (zona/departamento). `insert_geografia.sql` ya carga
  1.451 filas de zonas/departamentos/localidades sin índices extra más
  allá de las PK, y funciona sin problema.

### Decisión: seguir con Oracle (relacional). No hace falta NoSQL

Con 100-10.000 filas, cualquier motor relacional con índices
razonables responde en milisegundos — esta escala está muy por debajo
del punto donde un motor relacional empieza a sufrir. Migrar a NoSQL
acá no resolvería un problema de performance real (no lo hay a este
volumen); sumaría una segunda base de datos para mantener sincronizada
con `representates`/`zonas`/`departamentos`/`localidades`, otro
conector en el backend, y otro contenedor en `docker-compose.yml`.

Además, Oracle 21c+ ya da lo que se buscaría en una base de documentos:
`empresas.datos_publico` es una columna `JSON` nativa (formato binario
OSON), consultable con `JSON_VALUE`/`JSON_TABLE`, indexable, y hasta
accesible como colección de documentos vía SODA si hiciera falta. Es
un modelo híbrido: relacional para lo que tiene relaciones claras
(usuarios, geografía), documento flexible para el perfil público de
cada empresa.

### Dónde estaba el riesgo real de velocidad (y qué se hizo)

El motor nunca fue el cuello de botella. Los puntos que sí pegan en la
velocidad de carga son estos tres, y los dos primeros ya se resolvieron
en este cambio:

#### 1. Conexión nueva por request → pool de conexiones ✅ hecho

`backend/db_connector.py` abría (`oracledb.connect(...)`) y cerraba una
conexión Oracle **en cada llamada** a `execute_query()`. El handshake
de conexión (TCP + negociación TNS + autenticación) es, para una
query que devuelve unas pocas filas, mucho más lento que la query en
sí. Con varios usuarios navegando el mapa a la vez, esto es lo que se
iba a sentir como "lentitud", no el motor de base de datos.

Se reemplazó por un **pool de conexiones** (`oracledb.create_pool`,
creado una sola vez y reutilizado): cada request toma una conexión ya
abierta (`pool.acquire()`) y la devuelve al pool al terminar, en vez de
pagar el costo de conexión cada vez. Tamaño configurable por entorno
(`DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_INCREMENT` en `.envexample`,
default 2/10/1). El pool se cierra prolijamente al apagar el backend
(`lifespan` en `backend/main.py`).

#### 2. Filtrado por rubro/zona/departamento sin índice → índices sobre columnas virtuales ✅ hecho

Los filtros que pide el proyecto (README: *"Filtrado avanzado por
geolocalización (departamentos) y rubros"*) caen dentro del JSON de
`datos_publico`. Sin índice, un `WHERE` sobre esos campos forzaba a
Oracle a leer y parsear el JSON de cada fila (full scan) en cada
request del mapa público — no importa si son 100 filas o 100.000, es
trabajo desperdiciado en cada carga de página.

`db/indices_empresas.sql` agrega columnas **virtuales** (`rubro_vc`,
`zona_vc`, `departamento_vc`) generadas con `JSON_VALUE` sobre
`datos_publico`, e índices B-tree sobre esas columnas (más uno
combinado `departamento_vc + rubro_vc` para el filtro típico
"departamento X y rubro Y" del dashboard). Las columnas virtuales no
ocupan espacio propio ni duplican datos — Oracle las calcula al vuelo
y el optimizador usa el índice automáticamente. `datos_publico` sigue
siendo la única fuente de verdad; nada se desincroniza.

Correr `bigbang.sql` y después `indices_empresas.sql` (en ese orden)
contra el esquema `cba_vidriera`.

#### 3. Consultar Oracle en cada carga de página → archivo JSON de la vidriera ✅ hecho

El listado público cambia poco (una empresa entra o sale cuando un admin
la aprueba o rechaza, y sus productos cuando el representante los edita),
así que no conviene consultar Oracle en cada carga de página.

`GET /api/v1/landing/empresas` y `GET /api/v1/landing/empresas/{id}` leen
de un archivo, `backend/empresas_repo/empresas.json`, que contiene el
documento de cada empresa aprobada con sus productos
(`backend/api/v1/servicios/vidriera_json.py`). Oracle sigue siendo la
fuente de verdad y el respaldo; el archivo se regenera entero desde la
tabla:

- cuando un admin aprueba o rechaza una empresa;
- cuando un representante agrega, edita o borra un producto;
- cuando el archivo no se encuentra o está dañado (lo arma la primera
  lectura).

En una prueba local contra el servidor del proyecto, la consulta que arma
el archivo desde Oracle tardó 0,19 s y las siguientes, ya leyendo el
archivo, 0,003 s.

Limitación: un cambio hecho directo en la base (por ejemplo desde DBeaver)
no regenera el archivo. Para que la vidriera lo tome hay que borrarlo.

#### 4. Bugs de esquema encontrados al usar estos scripts contra una base real

Ninguno de los scripts de este directorio se había corrido nunca
contra una base Oracle real antes de armar el pipeline de revisión de
empresas. Al hacerlo aparecieron dos bugs latentes:

- `bigbang.sql` crea `representates.id_representante` como `IDENTITY`
  pero sin `PRIMARY KEY`/`UNIQUE`. Cualquier `FOREIGN KEY` que apunte a
  esa columna falla con `ORA-02270`. `empresas_revision.sql` agrega esa
  `PRIMARY KEY` como prerrequisito antes de tocar `empresas`.
- `indices_empresas.sql` declaraba las columnas virtuales como
  `VARCHAR2(150)`, pero `JSON_VALUE` sin `RETURNING` devuelve
  `VARCHAR2(4000)` por default para validar ese tamaño → `ORA-12899`.
  Se corrigió agregando `RETURNING VARCHAR2(150)` explícito en cada
  `JSON_VALUE`.

`noticias.sql` no se corrió contra la base de `bauti_dev` usada para
estas pruebas (se deja así a propósito, es útil para el TP de
testing), así que no se pudo confirmar si tiene el mismo problema de PK
que tenía `representates` — si en algún momento se corre, revisar lo
mismo.

### Productos dentro del JSON de la empresa

Los productos de cada empresa se guardan adentro de `empresas.datos_publico`,
en la clave `productos`: un diccionario cuya clave es el id del producto y
cuyo valor tiene `id`, `nombre`, `descripcion` y `ubicacion_imagen` (ver el
ejemplo en `empresas.json`). No hay tabla `productos`.

Es el criterio de diseño de una base de documentos: se guarda junto lo que
se lee junto. La ficha de una empresa necesita siempre sus productos, así
que salen en la misma lectura por clave primaria, sin join ni segunda
consulta. No requirió cambios de esquema: la columna `JSON` acepta la clave
nueva tal cual.

Lo que queda afuera del documento son las imágenes: van a disco, en
`backend/empresas_repo/<id_empresa>/`, y el JSON guarda solo su ubicación.
Así el documento se mantiene chico (texto) y el navegador puede cachear
cada imagen por separado. El backend limita a 50 productos por empresa
para que el documento no crezca sin tope.

### Resumen

| Punto | Estado |
|---|---|
| Motor relacional (Oracle) alcanza para este volumen | Confirmado, no se cambia |
| Pool de conexiones en `db_connector.py` | ✅ Hecho |
| Índices para filtros de `empresas` (rubro/zona/departamento) | ✅ Hecho (`indices_empresas.sql`, corregido el bug de `RETURNING`) |
| Endpoint público que lista `empresas` aprobadas, filtrable por rubro | ✅ Hecho (`GET /api/v1/landing/empresas`) |
| Listado público sin consultar Oracle en cada carga | ✅ Hecho (archivo `empresas_repo/empresas.json`, regenerado desde Oracle) |
| `PRIMARY KEY` faltante en `representates.id_representante` | ✅ Hecho (`empresas_revision.sql`) |
| Productos embebidos en `empresas.datos_publico` | ✅ Hecho (`backend/api/v1/servicios/productos_empresa.py`) |
