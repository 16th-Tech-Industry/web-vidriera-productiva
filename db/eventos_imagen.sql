-- Imagen de los eventos (la muestra el calendario de la landing).
--
-- Igual que noticias.imagen_archivo: la imagen NO se guarda en la base,
-- se guarda en disco en backend/uploads/eventos/ y acá solo va el nombre
-- del archivo (NULL si el evento no tiene imagen). La API la devuelve como
-- imagen_url = /uploads/eventos/<archivo>. Ver backend/api/v1/endpoints/eventos.py.
--
-- Correr después de bigbang.sql, contra el esquema cba_vidriera.
-- Aplicado en el servidor el 2026-11-01.

ALTER TABLE eventos ADD (imagen_archivo VARCHAR2(300));
