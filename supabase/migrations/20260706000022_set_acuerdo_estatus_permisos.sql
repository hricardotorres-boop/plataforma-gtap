-- set_acuerdo_estatus es security definer y hasta ahora no verificaba que
-- quien la llama tenga permiso sobre ese acuerdo (podía saltarse las RLS de
-- escritura). Se agrega el mismo chequeo de rol/ooad que usan las políticas,
-- y se exige justificación no vacía (el plan la marca como obligatoria).
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
  v_ooad_id uuid;
begin
  if p_nuevo_estatus not in ('vigente', 'cumplido', 'incumplido', 'sin_seguimiento', 'no_verificable') then
    raise exception 'Estatus de acuerdo inválido: %', p_nuevo_estatus;
  end if;

  if p_justificacion is null or btrim(p_justificacion) = '' then
    raise exception 'La justificación es obligatoria para cambiar el estatus de un acuerdo';
  end if;

  select a.estatus, s.ooad_id into v_estatus_anterior, v_ooad_id
  from acuerdos a
  join sesiones s on s.id = a.sesion_id
  where a.id = p_acuerdo_id;

  if v_estatus_anterior is null then
    raise exception 'Acuerdo % no existe', p_acuerdo_id;
  end if;

  if not (es_rol_central() or (current_rol() = 'usuario_ooad' and v_ooad_id = current_ooad_id())) then
    raise exception 'No tiene permiso para cambiar el estatus de este acuerdo';
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
