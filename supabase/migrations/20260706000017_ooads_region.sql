-- Región geográfica del OOAD (Norte, Occidente, Sur, Centro), tal como
-- viene en el catálogo oficial. Nulable para OOAD que no la tengan definida.
alter table ooads add column region text;

-- El catálogo oficial repite el nombre "DF NORTE" y "DF SUR" dos veces cada
-- uno (Ciudad de México se divide en más de un OOAD por tamaño), distinguidos
-- solo por su sección sindical. La unicidad debe considerar ambos campos.
alter table ooads drop constraint ooads_nombre_key;
alter table ooads add constraint ooads_nombre_seccion_sntss_key unique (nombre, seccion_sntss);
