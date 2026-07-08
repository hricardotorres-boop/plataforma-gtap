-- El catálogo oficial trae casos legítimos del mismo texto de subtema
-- repetido bajo distinta competencia (ooad y central). La unicidad debe
-- considerar competencia, no solo tema+subtema.
alter table temas_catalogo drop constraint temas_catalogo_tema_subtema_key;
alter table temas_catalogo add constraint temas_catalogo_tema_subtema_competencia_key
  unique (tema, subtema, competencia);
