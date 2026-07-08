-- Funciones auxiliares para las políticas RLS.
-- current_rol() y current_ooad_id() son SECURITY DEFINER a propósito:
-- leen usuarios_perfil sin pasar por sus propias políticas RLS, evitando
-- recursión infinita (la política de usuarios_perfil también las usa).

create or replace function current_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from usuarios_perfil where id = auth.uid();
$$;

create or replace function current_ooad_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ooad_id from usuarios_perfil where id = auth.uid();
$$;

-- admin_central y analista_central: acceso central con lectura/escritura amplia
create or replace function es_rol_central()
returns boolean
language sql
stable
as $$
  select current_rol() in ('admin_central', 'analista_central');
$$;

-- Quién puede leer todo el país: roles centrales, o consulta sin ooad_id (consulta central)
create or replace function puede_leer_todo()
returns boolean
language sql
stable
as $$
  select es_rol_central() or (current_rol() = 'consulta' and current_ooad_id() is null);
$$;

-- ooad_id de la sesión referenciada, para políticas de tablas hijas de sesiones.
-- SECURITY INVOKER a propósito: si el usuario no puede ver la sesión (por su
-- propia política RLS), esta función tampoco la ve, y la comparación falla
-- de forma segura por diseño.
create or replace function sesion_ooad_id(p_sesion_id uuid)
returns uuid
language sql
stable
as $$
  select ooad_id from sesiones where id = p_sesion_id;
$$;
