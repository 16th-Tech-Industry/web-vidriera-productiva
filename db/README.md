# Base de datos — decisiones de motor y performance

Este documento responde una pregunta que surgió sobre el proyecto:
**¿Oracle (relacional) aguanta el volumen de consultas del sitio, o
convendría pasar a una base no relacional (NoSQL) para que los datos de
las empresas carguen rápido en la web?**

## Contexto

- Motor: Oracle Database (`gvenzl/oracle-free:23-slim`, ver
  `docker-compose.yml`), con soporte nativo de tipo `JSON` desde 21c.
- Tablas: `representates`, `empresas` (con `datos_publico JSON`),
  `zonas`, `departamentos`, `localidades` (ver `bigbang.sql`).
- Volumen esperado: el "expositor digital" público muestra del orden
  de 100 empresas o más en un mapa/listado, filtrable por rubro y por
  geolocalización (zona/departamento). `insert_geografia.sql` ya carga
  1.451 filas de zonas/departamentos/localidades sin índices extra más
  allá de las PK, y funciona sin problema.

## Decisión: seguir con Oracle (relacional). No hace falta NoSQL

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

## Dónde estaba el riesgo real de velocidad (y qué se hizo)

El motor nunca fue el cuello de botella. Los puntos que sí pegan en la
velocidad de carga son estos tres, y los dos primeros ya se resolvieron
en este cambio:

### 1. Conexión nueva por request → pool de conexiones ✅ hecho

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

### 2. Filtrado por rubro/zona/departamento sin índice → índices sobre columnas virtuales ✅ hecho

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

### 3. Consultar Oracle en cada carga de página → cachear el listado público (pendiente)

`GET /api/v1/landing/empresas` (`backend/api/v1/endpoints/landing.py`) ya
existe: lista las empresas con `estado = aprobada`, filtrable por
`rubro` vía la columna virtual `rubro_vc`. Hoy pega contra Oracle en
cada request — el mapa del frontend (`frontend/src/components/mapa/mapa.tsx`)
todavía no lo consume, sigue leyendo el JSON estático embebido
(`frontend/src/assets/db.json`).

La recomendación sigue siendo la misma: cuando el mapa pase a consumir
este endpoint, **no** conviene consultar Oracle en cada carga de
página — ese listado público cambia poco (una empresa se da de
alta/baja cuando un admin la aprueba o rechaza, no en tiempo real), así
que conviene:

- una cache en memoria del lado del backend con TTL corto (segundos a
  minutos), o
- invalidar/regenerar la cache cuando el admin aprueba/rechaza una
  empresa desde el dashboard (`PATCH /dashboard/empresas/{id}/aprobar`
  o `/rechazar`), en vez de por tiempo.

Sigue pendiente porque, con el volumen de datos actual (0 empresas
reales todavía), no es un problema real hoy — se deja documentado para
no perder el criterio cuando el frontend se conecte y el volumen
crezca.

### 4. Bugs de esquema encontrados al usar estos scripts contra una base real

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

## Resumen

| Punto | Estado |
|---|---|
| Motor relacional (Oracle) alcanza para este volumen | Confirmado, no se cambia |
| Pool de conexiones en `db_connector.py` | ✅ Hecho |
| Índices para filtros de `empresas` (rubro/zona/departamento) | ✅ Hecho (`indices_empresas.sql`, corregido el bug de `RETURNING`) |
| Endpoint público que lista `empresas` aprobadas, filtrable por rubro | ✅ Hecho (`GET /api/v1/landing/empresas`) |
| Cache del listado público de empresas | ⏳ Pendiente (endpoint ya existe; sin cache todavía, volumen actual no lo justifica) |
| `PRIMARY KEY` faltante en `representates.id_representante` | ✅ Hecho (`empresas_revision.sql`) |
