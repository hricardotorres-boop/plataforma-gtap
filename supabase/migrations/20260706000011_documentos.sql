-- Metadatos de archivos almacenados en Supabase Storage
create table documentos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones (id) on delete cascade,
  tipo text not null check (tipo in ('acta', 'anexo', 'reporte_analisis', 'ficha_tecnica')),
  nombre_archivo text not null,
  ruta_storage text not null,
  subido_por uuid references usuarios_perfil (id),
  fecha_subida timestamptz not null default now()
);

create index idx_documentos_sesion_id on documentos (sesion_id);

comment on table documentos is 'Metadatos de actas, anexos, reportes y fichas técnicas. El archivo vive en Supabase Storage.';
