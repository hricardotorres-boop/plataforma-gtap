-- Acuerdos derivados de los puntos de sesión, con cadena de seguimiento entre sesiones
create table acuerdos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones (id) on delete cascade,
  punto_sesion_id uuid references puntos_sesion (id),
  texto_literal text not null,
  fecha_compromiso date,
  responsable text,
  estatus text not null default 'sin_seguimiento'
    check (estatus in ('vigente', 'cumplido', 'incumplido', 'sin_seguimiento', 'no_verificable')),
  acuerdo_origen_id uuid references acuerdos (id)
);

create index idx_acuerdos_sesion_id on acuerdos (sesion_id);
create index idx_acuerdos_estatus on acuerdos (estatus);

comment on table acuerdos is 'Acuerdos de una sesión. fecha_compromiso y responsable aceptan nulo a propósito: su ausencia es un hallazgo, nunca se infiere.';
comment on column acuerdos.acuerdo_origen_id is 'Autorreferencia: liga este acuerdo con su antecedente en una sesión anterior para dar seguimiento.';

-- El estatus de un acuerdo solo puede cambiar mediante esta función, que además
-- registra el cambio en bitácora. Un trigger impide el UPDATE directo de estatus.

create or replace function set_acuerdo_estatus(
  p_acuerdo_id uuid,
  p_nuevo_estatus text,
  p_justificacion text,
  p_usuario_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estatus_anterior text;
begin
  if p_nuevo_estatus not in ('vigente', 'cumplido', 'incumplido', 'sin_seguimiento', 'no_verificable') then
    raise exception 'Estatus de acuerdo inválido: %', p_nuevo_estatus;
  end if;

  select estatus into v_estatus_anterior from acuerdos where id = p_acuerdo_id;

  if v_estatus_anterior is null then
    raise exception 'Acuerdo % no existe', p_acuerdo_id;
  end if;

  perform set_config('gtap.cambio_estatus_autorizado', 'true', true);

  update acuerdos set estatus = p_nuevo_estatus where id = p_acuerdo_id;

  insert into bitacora (usuario_id, accion, tabla_afectada, registro_id, detalle)
  values (
    p_usuario_id,
    'cambio_estatus_acuerdo',
    'acuerdos',
    p_acuerdo_id,
    jsonb_build_object(
      'estatus_anterior', v_estatus_anterior,
      'estatus_nuevo', p_nuevo_estatus,
      'justificacion', p_justificacion
    )
  );
end;
$$;

create or replace function guard_acuerdo_estatus()
returns trigger
language plpgsql
as $$
begin
  if old.estatus is distinct from new.estatus
     and coalesce(current_setting('gtap.cambio_estatus_autorizado', true), 'false') <> 'true' then
    raise exception 'El estatus de un acuerdo solo puede cambiar mediante set_acuerdo_estatus()';
  end if;
  return new;
end;
$$;

create trigger trg_guard_acuerdo_estatus
  before update on acuerdos
  for each row
  execute function guard_acuerdo_estatus();
