-- Solo admin_central puede cambiar el rol o el ooad_id de un perfil.
-- Un usuario puede editar el resto de su propio perfil (ej. nombre_completo)
-- pero no puede auto-elevarse ni cambiarse de ooad.
create or replace function guard_usuarios_perfil_rol()
returns trigger
language plpgsql
as $$
begin
  if (old.rol is distinct from new.rol or old.ooad_id is distinct from new.ooad_id)
     and coalesce(current_rol(), '') <> 'admin_central' then
    raise exception 'Solo admin_central puede cambiar rol u ooad_id de un perfil';
  end if;
  return new;
end;
$$;

create trigger trg_guard_usuarios_perfil_rol
  before update on usuarios_perfil
  for each row
  execute function guard_usuarios_perfil_rol();
