-- El registro de alerta se crea automáticamente cuando un punto de sesión
-- coincide con un tema de competencia central (Módulo 3), pero la
-- clasificación roja/naranja la asigna una persona después. Mientras no se
-- clasifique, el campo queda vacío: el sistema nunca infiere la clasificación.
alter table alertas_competencia alter column clasificacion drop not null;
