-- Políticas de Storage espejo de las RLS de la tabla documentos.
-- Ruta esperada: ooad_{ooad_id}/sesion_{sesion_id}/{documento_id}_{nombre}
-- Sin políticas de update/delete: los objetos son inmutables, igual que
-- las filas de documentos (nunca se borran, se versionan).

create policy documentos_storage_select on storage.objects for select
  to authenticated using (
    bucket_id in ('actas', 'reportes', 'fichas')
    and (
      es_rol_central()
      or (current_rol() = 'usuario_ooad' and (storage.foldername(name))[1] = 'ooad_' || current_ooad_id()::text)
    )
  );

create policy documentos_storage_insert on storage.objects for insert
  to authenticated with check (
    bucket_id in ('actas', 'reportes', 'fichas')
    and (
      es_rol_central()
      or (current_rol() = 'usuario_ooad' and (storage.foldername(name))[1] = 'ooad_' || current_ooad_id()::text)
    )
  );
