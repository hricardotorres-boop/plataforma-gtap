-- Catálogo oficial de temas y subtemas (precargado en seed.sql)
create table temas_catalogo (
  id uuid primary key default gen_random_uuid(),
  tema text not null,
  subtema text,
  competencia text not null check (competencia in ('ooad', 'central')),
  unique (tema, subtema)
);

comment on table temas_catalogo is 'Catálogo oficial de temas y subtemas prioritarios, con su nivel de competencia.';
