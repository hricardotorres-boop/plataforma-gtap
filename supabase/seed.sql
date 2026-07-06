-- Datos de precarga y de prueba. Todo lo aquí sembrado es ficticio.

-- Catálogo de temas: placeholder representativo. Pendiente sustituir/ampliar
-- con el catálogo completo de TEMAS_DELEGACIONAL_NIVEL_OOAD cuando se
-- proporcione; el esquema de temas_catalogo ya queda listo para recibirlo
-- sin cambios de estructura.
insert into temas_catalogo (tema, subtema, competencia) values
  ('Abasto de medicamentos', 'Surtimiento oportuno de receta', 'ooad'),
  ('Abasto de medicamentos', 'Clave surtida en farmacia', 'ooad'),
  ('Prestaciones económicas', 'Pago de incapacidades', 'central'),
  ('Prestaciones económicas', 'Trámite de pensiones', 'central'),
  ('Infraestructura y equipamiento', 'Mantenimiento de unidades médicas', 'ooad'),
  ('Relación laboral', 'Condiciones generales de trabajo', 'central');

-- OOAD ficticios para pruebas de sesiones, acuerdos y (en el Módulo 2) RLS
insert into ooads (nombre, tipo, activo) values
  ('OOAD Prueba Norte', 'ooad', true),
  ('OOAD Prueba Sur', 'ooad', true);

-- Sesión ficticia de ejemplo en OOAD Prueba Norte
with sesion_nueva as (
  insert into sesiones (ooad_id, numero_sesion, tipo, fecha, sede, quorum_certificado, estatus)
  select id, 1, 'ordinaria', date '2026-02-10', 'Sala de juntas ficticia', true, 'celebrada'
  from ooads where nombre = 'OOAD Prueba Norte'
  returning id
),
punto_nuevo as (
  insert into puntos_sesion (sesion_id, tema_catalogo_id, texto_literal, orden)
  select
    sesion_nueva.id,
    (select id from temas_catalogo where tema = 'Abasto de medicamentos' and subtema = 'Surtimiento oportuno de receta'),
    'Se revisa el surtimiento de recetas del trimestre en la unidad ficticia de prueba.',
    1
  from sesion_nueva
  returning id, sesion_id
)
insert into acuerdos (sesion_id, punto_sesion_id, texto_literal, fecha_compromiso, responsable, estatus)
select
  punto_nuevo.sesion_id,
  punto_nuevo.id,
  'Se acuerda dar seguimiento al desabasto reportado en la unidad ficticia de prueba.',
  null,
  null,
  'sin_seguimiento'
from punto_nuevo;
