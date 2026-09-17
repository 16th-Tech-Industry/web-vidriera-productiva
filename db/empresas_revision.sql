-- Circuito de revisión de empresas: el usuario (representante) carga los
-- datos desde su dashboard, y quedan pendientes hasta que un admin los
-- aprueba o rechaza desde el dashboard admin. Ver
-- backend/api/v1/endpoints/dashboard/empresas.py (alta, usuario) y
-- backend/api/v1/endpoints/dashboard/empresas_revision.py (revisión, admin).
--
-- Correr después de bigbang.sql, contra el esquema cba_vidriera.
--
-- Prerrequisito: bigbang.sql crea `representates.id_representante` como
-- IDENTITY pero sin PRIMARY KEY/UNIQUE. El FK de más abajo (id_representante
-- en empresas) necesita una de las dos del lado referenciado, así que hay
-- que agregarla antes o el ALTER TABLE empresas falla con ORA-02270.
ALTER TABLE representates ADD CONSTRAINT pk_representates PRIMARY KEY (id_representante);

ALTER TABLE empresas ADD (
    -- 0 pendiente (recién cargada, no visible en la vidriera pública)
    -- 1 aprobada  (visible en la vidriera pública)
    -- 2 rechazada (ver motivo_rechazo)
    estado              NUMBER(1) DEFAULT 0 NOT NULL,
    motivo_rechazo      VARCHAR2(500),
    id_representante    NUMBER,
    CONSTRAINT fk_empresas_representante FOREIGN KEY (id_representante)
        REFERENCES representates(id_representante)
);

-- El dashboard admin siempre arranca filtrando por pendientes.
CREATE INDEX idx_empresas_estado ON empresas (estado);
