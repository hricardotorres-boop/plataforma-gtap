-- Alertas cuando un punto de sesión toca un tema de competencia central
create table alertas_competencia (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones (id) on delete cascade,
  punto_sesion_id uuid references puntos_sesion (id),
  clasificacion text not null check (clasificacion in ('roja', 'naranja')),
  justificacion text,
  cita_literal text
);

create index idx_alertas_competencia_sesion_id on alertas_competencia (sesion_id);

comment on table alertas_competencia is 'Alertas de posible competencia central detectadas en el orden del día.';
