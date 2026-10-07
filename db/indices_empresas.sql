-- Índices para el filtrado público de empresas (mapa/vidriera digital).
--
-- Por qué existe este script aparte de bigbang.sql:
-- `empresas.datos_publico` es una columna JSON (Oracle 21c+, tipo nativo,
-- no texto). Los filtros que pide el proyecto para la consulta pública y
-- el dashboard admin (por rubro y por geolocalización: zona/departamento)
-- viven ADENTRO de ese JSON, no como columnas propias. Sin un índice,
-- cualquier WHERE sobre esos campos obliga a Oracle a leer y parsear el
-- JSON entero de cada fila (full scan) en cada request del mapa público.
--
-- La solución no es duplicar esos datos en una tabla/columna aparte (eso
-- desincroniza), sino declarar columnas VIRTUALES generadas a partir del
-- JSON con JSON_VALUE, e indexar esas columnas virtuales. Oracle calcula
-- el valor al vuelo (no ocupa espacio de storage propio) y el optimizador
-- usa el índice automáticamente cuando el WHERE filtra por rubro/zona/
-- departamento. `datos_publico` sigue siendo la única fuente de verdad.
--
-- Correr esto una sola vez, después de bigbang.sql, contra el
-- esquema cba_vidriera.

ALTER TABLE empresas ADD (
    rubro_vc         VARCHAR2(150)
        GENERATED ALWAYS AS (JSON_VALUE(datos_publico, '$.rubro')) VIRTUAL,
    zona_vc          VARCHAR2(150)
        GENERATED ALWAYS AS (JSON_VALUE(datos_publico, '$.ubicacion.zona')) VIRTUAL,
    departamento_vc  VARCHAR2(150)
        GENERATED ALWAYS AS (JSON_VALUE(datos_publico, '$.ubicacion.departamento')) VIRTUAL
);

CREATE INDEX idx_empresas_rubro         ON empresas (rubro_vc);
CREATE INDEX idx_empresas_zona          ON empresas (zona_vc);
CREATE INDEX idx_empresas_departamento  ON empresas (departamento_vc);

-- Combinado, para el caso típico del dashboard: "empresas de tal
-- departamento Y tal rubro" en una sola consulta.
CREATE INDEX idx_empresas_depto_rubro   ON empresas (departamento_vc, rubro_vc);

/* Cómo se usan (Oracle detecta el índice automáticamente si la
 * expresión del WHERE coincide con la de la columna virtual, o si se
 * filtra directamente por la columna virtual):
 *
 * SELECT id_empresa, razon_social, datos_publico
 * FROM empresas
 * WHERE departamento_vc = 'Capital'
 *   AND rubro_vc = 'Alimentos';
 *
 * -- equivalente explícito sin nombrar la columna virtual:
 * SELECT id_empresa, razon_social, datos_publico
 * FROM empresas
 * WHERE JSON_VALUE(datos_publico, '$.ubicacion.departamento') = 'Capital';
 */
