-- Consulta de prueba del criterio de aceptación del Módulo 1:
-- sesiones con sus acuerdos.

select
  s.id as sesion_id,
  o.nombre as ooad,
  s.numero_sesion,
  s.tipo,
  s.fecha,
  s.estatus as estatus_sesion,
  a.texto_literal as acuerdo,
  a.fecha_compromiso,
  a.responsable,
  a.estatus as estatus_acuerdo
from sesiones s
join ooads o on o.id = s.ooad_id
left join acuerdos a on a.sesion_id = s.id
order by s.fecha, a.texto_literal;
