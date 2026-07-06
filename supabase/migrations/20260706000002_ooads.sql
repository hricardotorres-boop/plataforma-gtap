-- Catálogo de los 35 OOAD y UMAE
create table ooads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null check (tipo in ('ooad', 'umae')),
  seccion_sntss text,
  activo boolean not null default true
);

comment on table ooads is 'Catálogo de Órganos de Operación Administrativa Desconcentrada y UMAE.';
