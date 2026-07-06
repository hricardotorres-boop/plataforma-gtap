-- Perfil de usuario, extiende auth.users
create table usuarios_perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  rol text not null default 'consulta'
    check (rol in ('admin_central', 'analista_central', 'usuario_ooad', 'consulta')),
  ooad_id uuid references ooads (id),
  constraint usuario_ooad_requiere_ooad_id
    check (rol <> 'usuario_ooad' or ooad_id is not null)
);

create index idx_usuarios_perfil_ooad_id on usuarios_perfil (ooad_id);

comment on table usuarios_perfil is 'Perfil de aplicación de cada usuario autenticado, con rol y ooad de pertenencia.';
