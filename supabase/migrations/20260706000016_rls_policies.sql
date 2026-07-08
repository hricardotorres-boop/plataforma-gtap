-- Políticas RLS según la matriz de permisos del plan:
-- admin_central: lee y escribe todo, administra usuarios y catálogos
-- analista_central: lee todo, escribe sesiones/acuerdos/análisis de cualquier OOAD
-- usuario_ooad: lee y escribe únicamente registros de su ooad_id
-- consulta: solo lectura de su ámbito (su OOAD, o todo si es consulta central)

alter table ooads enable row level security;
alter table usuarios_perfil enable row level security;
alter table bitacora enable row level security;
alter table temas_catalogo enable row level security;
alter table sesiones enable row level security;
alter table puntos_sesion enable row level security;
alter table acuerdos enable row level security;
alter table asistentes enable row level security;
alter table alertas_competencia enable row level security;
alter table documentos enable row level security;

-- ooads: catálogo de lectura general, solo admin_central administra
create policy ooads_select on ooads for select
  to authenticated using (true);
create policy ooads_write on ooads for all
  to authenticated using (current_rol() = 'admin_central')
  with check (current_rol() = 'admin_central');

-- temas_catalogo: catálogo de lectura general, solo admin_central administra
create policy temas_catalogo_select on temas_catalogo for select
  to authenticated using (true);
create policy temas_catalogo_write on temas_catalogo for all
  to authenticated using (current_rol() = 'admin_central')
  with check (current_rol() = 'admin_central');

-- usuarios_perfil: cada quien ve su propio perfil; roles centrales ven todos.
-- El insert lo hace únicamente el trigger handle_new_user (security definer).
-- El update de rol/ooad_id lo bloquea el trigger guard_usuarios_perfil_rol.
create policy usuarios_perfil_select on usuarios_perfil for select
  to authenticated using (id = auth.uid() or es_rol_central());
create policy usuarios_perfil_update on usuarios_perfil for update
  to authenticated using (id = auth.uid() or current_rol() = 'admin_central')
  with check (id = auth.uid() or current_rol() = 'admin_central');

-- bitacora: auditoría de solo lectura para roles centrales.
-- Sin políticas de escritura: las escrituras se hacen vía funciones
-- security definer (ej. set_acuerdo_estatus) o service_role en servidor.
create policy bitacora_select on bitacora for select
  to authenticated using (es_rol_central());

-- sesiones: lectura según ámbito, escritura central o del propio OOAD
create policy sesiones_select on sesiones for select
  to authenticated using (puede_leer_todo() or ooad_id = current_ooad_id());
create policy sesiones_write on sesiones for all
  to authenticated
  using (es_rol_central() or (current_rol() = 'usuario_ooad' and ooad_id = current_ooad_id()))
  with check (es_rol_central() or (current_rol() = 'usuario_ooad' and ooad_id = current_ooad_id()));

-- puntos_sesion: heredan el ámbito de su sesión
create policy puntos_sesion_select on puntos_sesion for select
  to authenticated using (puede_leer_todo() or sesion_ooad_id(sesion_id) = current_ooad_id());
create policy puntos_sesion_write on puntos_sesion for all
  to authenticated
  using (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()))
  with check (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()));

-- acuerdos: heredan el ámbito de su sesión.
-- El cambio de estatus solo se hace vía set_acuerdo_estatus (trigger guard_acuerdo_estatus),
-- estas políticas cubren el resto de columnas y el alta/lectura del acuerdo.
create policy acuerdos_select on acuerdos for select
  to authenticated using (puede_leer_todo() or sesion_ooad_id(sesion_id) = current_ooad_id());
create policy acuerdos_write on acuerdos for all
  to authenticated
  using (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()))
  with check (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()));

-- asistentes: heredan el ámbito de su sesión
create policy asistentes_select on asistentes for select
  to authenticated using (puede_leer_todo() or sesion_ooad_id(sesion_id) = current_ooad_id());
create policy asistentes_write on asistentes for all
  to authenticated
  using (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()))
  with check (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()));

-- alertas_competencia: heredan el ámbito de su sesión
create policy alertas_competencia_select on alertas_competencia for select
  to authenticated using (puede_leer_todo() or sesion_ooad_id(sesion_id) = current_ooad_id());
create policy alertas_competencia_write on alertas_competencia for all
  to authenticated
  using (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()))
  with check (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()));

-- documentos: heredan el ámbito de su sesión (los permisos de Storage se
-- configuran aparte en el Módulo 4, como espejo de estas políticas)
create policy documentos_select on documentos for select
  to authenticated using (puede_leer_todo() or sesion_ooad_id(sesion_id) = current_ooad_id());
create policy documentos_write on documentos for all
  to authenticated
  using (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()))
  with check (es_rol_central() or (current_rol() = 'usuario_ooad' and sesion_ooad_id(sesion_id) = current_ooad_id()));
