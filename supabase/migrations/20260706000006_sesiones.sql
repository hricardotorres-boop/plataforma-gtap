-- Una fila por sesión GTAP
create table sesiones (
  id uuid primary key default gen_random_uuid(),
  ooad_id uuid not null references ooads (id),
  numero_sesion integer not null,
  tipo text not null check (tipo in ('ordinaria', 'extraordinaria', 'instalacion')),
  fecha date not null,
  sede text,
  hora_inicio time,
  quorum_certificado boolean not null default false,
  estatus text not null default 'programada'
    check (estatus in ('programada', 'celebrada', 'analizada')),
  creado_por uuid references usuarios_perfil (id),
  fecha_registro timestamptz not null default now()
);

create index idx_sesiones_ooad_id on sesiones (ooad_id);
create index idx_sesiones_estatus on sesiones (estatus);

-- Un OOAD no puede tener dos sesiones con el mismo número y tipo en el mismo año
create unique index uq_sesiones_ooad_numero_tipo_anio
  on sesiones (ooad_id, numero_sesion, tipo, extract(year from fecha));

comment on table sesiones is 'Sesiones GTAP celebradas o programadas por OOAD.';
