-- Los documentos nunca se eliminan: se versionan. Al subir una nueva
-- versión, la anterior se marca vigente = false (update, nunca delete) y
-- la nueva fila referencia a la que sustituye.
alter table documentos add column vigente boolean not null default true;
alter table documentos add column sustituye_a uuid references documentos(id);
