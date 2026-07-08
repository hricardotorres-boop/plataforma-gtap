-- Buckets privados de Storage. El acceso siempre es vía URL firmada con
-- expiración, nunca enlaces públicos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('actas', 'actas', false, 20971520, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('reportes', 'reportes', false, 20971520, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('fichas', 'fichas', false, 20971520, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
