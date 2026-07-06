-- Registro de auditoría de toda escritura relevante
create table bitacora (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios_perfil (id),
  accion text not null,
  tabla_afectada text not null,
  registro_id uuid,
  fecha timestamptz not null default now(),
  detalle jsonb
);

create index idx_bitacora_tabla_registro on bitacora (tabla_afectada, registro_id);
create index idx_bitacora_usuario_id on bitacora (usuario_id);

comment on table bitacora is 'Auditoría: toda escritura relevante en el sistema queda registrada aquí.';
