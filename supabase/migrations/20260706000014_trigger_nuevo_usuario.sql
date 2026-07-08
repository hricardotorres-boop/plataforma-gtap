-- Al registrarse un usuario, crea automáticamente su perfil con rol
-- 'consulta' por defecto. Solo admin_central puede elevar roles después
-- (ver trigger guard_usuario_perfil_rol).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios_perfil (id, nombre_completo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', new.email),
    'consulta'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
