# Manual de conexión a Oracle con DBeaver

Guía para conectarse a la instancia Oracle Database Free 23ai del proyecto y volver a correr `bigbang.sql` desde cero si hace falta.

## 1. Datos de conexión

| Dato | Valor |
|---|---|
| Host | ver `.env` (`DB_CONNECTION`) |
| Puerto | `1521` (default, no hace falta especificarlo) |
| Service name (CDB root) | `free` |
| Service name (PDB) | `freepdb1` |
| Usuario admin | `PDBADMIN` |

**Las credenciales oficiales (host, usuarios, passwords) viven únicamente en el `.env` de la raíz del proyecto** (`DB_USER`, `DB_CONNECTION`, `PASSWORD`) — no se versionan por seguridad y no se repiten en este manual. Pedí acceso a ese archivo a quien administre el proyecto si no lo tenés.

**Importante:** siempre hay que conectarse contra el service name **`freepdb1`** (el PDB), nunca contra `free` (el CDB root). Si te conectás contra `free`, cualquier `CREATE USER` va a fallar con `ORA-65096: common user or role name must start with prefix C##`.

## 2. Crear las dos conexiones en DBeaver

Este script necesita **dos conexiones distintas** porque crea un usuario nuevo y después opera con ese usuario — DBeaver no permite cambiar de usuario a mitad de una sesión con `CONNECT` (eso es un comando de SQL\*Plus, no SQL válido).

### Conexión A — Admin (`PDBADMIN`)

1. Database → New Database Connection → Oracle.
2. Host y puerto: los del `.env` (`DB_CONNECTION`).
3. Service name: `freepdb1` (**no** `free`).
4. Usuario: `PDBADMIN` / password del `.env` (`PASSWORD`).
5. Test Connection → Finish.

Se usa para: crear el usuario `cba_vidriera` y darle permisos (líneas 1-9 de `bigbang.sql`).

### Conexión B — Aplicación (`cba_vidriera`)

1. Database → New Database Connection → Oracle.
2. Host y puerto: los mismos que la Conexión A.
3. Service name: `freepdb1`.
4. Usuario: `cba_vidriera` / la password definida en el `CREATE USER` de `bigbang.sql`.
5. Test Connection → Finish.

Se usa para: crear las tablas (`representates`, `empresas`, `zonas`, `departamentos`, `localidades`).

Esta conexión solo va a funcionar **después** de correr la Conexión A al menos una vez (el usuario tiene que existir primero).

## 3. Ejecutar `bigbang.sql` de cero

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

## 4. Errores que ya nos salieron (troubleshooting)

| Error | Causa | Solución |
|---|---|---|
| `ORA-65096: common user or role name must start with prefix C##` | La conexión apunta al CDB root (`free`) en vez del PDB (`freepdb1`) | Reconfigurar el service name de la conexión a `freepdb1` |
| `ORA-00900: invalid SQL statement` | El script tenía un `CONNECT usuario/pass` — comando de SQL\*Plus, inválido en DBeaver | Usar dos conexiones separadas (ver sección 2) en vez de `CONNECT` |
| `ORA-03061: Precision cannot be specified for data type INT` | Columnas definidas como `INT(1)` — sintaxis de MySQL, no válida en Oracle | Usar `NUMBER(1)` en vez de `INT(1)` |
| `ORA-00931: missing identifier` / `ORA-03078: unexpected right parenthesis after ,` | Coma colgante antes del `)` de cierre en un `CREATE TABLE` | Sacar la coma de la última columna definida |
| `ORA-43853: JSON type cannot be used in non-automatic segment space management tablespace "SYSTEM"` | La tabla con columna `JSON` (`empresas`) se creó estando conectado como `PDBADMIN` (default tablespace `SYSTEM`, sin ASSM) en vez de `cba_vidriera` (default tablespace `USERS`) | Ejecutar los `CREATE TABLE` con la Conexión B (`cba_vidriera`) activa |

## 5. Si hay que arrancar de cero (limpiar todo)

Conectado como `PDBADMIN`:

```sql
DROP USER cba_vidriera CASCADE;
```

Esto borra el usuario y todas sus tablas de una. Después repetir desde el paso 3.
