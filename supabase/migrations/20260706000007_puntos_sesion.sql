-- Temas tratados en cada sesión (orden del día)
create table puntos_sesion (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones (id) on delete cascade,
  tema_catalogo_id uuid references temas_catalogo (id),
  texto_literal text not null,
  orden integer not null,
  unique (sesion_id, orden)
);

create index idx_puntos_sesion_sesion_id on puntos_sesion (sesion_id);

comment on table puntos_sesion is 'Puntos del orden del día de una sesión, vinculados al catálogo de temas cuando aplica.';
