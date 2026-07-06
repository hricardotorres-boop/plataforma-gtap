-- Asistentes de cada sesión
create table asistentes (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones (id) on delete cascade,
  nombre text not null,
  cargo text,
  parte text not null check (parte in ('imss', 'sntss')),
  es_secretario_tecnico boolean not null default false
);

create index idx_asistentes_sesion_id on asistentes (sesion_id);

comment on table asistentes is 'Asistentes a una sesión, por parte IMSS o SNTSS.';
