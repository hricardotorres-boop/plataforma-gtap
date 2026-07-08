"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

function bucketDeTipo(tipo: string) {
  if (tipo === "acta" || tipo === "anexo") return "actas";
  if (tipo === "reporte_analisis") return "reportes";
  return "fichas";
}

export async function subirDocumento(sesionId: string, _prevState: { error?: string; ok?: boolean } | null, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa" };
  }

  const { data: sesion } = await supabase.from("sesiones").select("ooad_id").eq("id", sesionId).single();
  if (!sesion) {
    return { error: "Sesión no encontrada" };
  }

  const tipo = String(formData.get("tipo"));
  const archivo = formData.get("archivo") as File | null;
  const sustituyeA = String(formData.get("sustituye_a") ?? "") || null;

  if (!archivo || archivo.size === 0) {
    return { error: "Selecciona un archivo" };
  }

  const bucket = bucketDeTipo(tipo);
  const documentoId = randomUUID();
  const ruta = `ooad_${sesion.ooad_id}/sesion_${sesionId}/${documentoId}_${archivo.name}`;

  const { error: errorSubida } = await supabase.storage.from(bucket).upload(ruta, archivo, {
    contentType: archivo.type,
  });

  if (errorSubida) {
    return { error: errorSubida.message };
  }

  const { error: errorInsert } = await supabase.from("documentos").insert({
    id: documentoId,
    sesion_id: sesionId,
    tipo,
    nombre_archivo: archivo.name,
    ruta_storage: ruta,
    subido_por: user.id,
    vigente: true,
    sustituye_a: sustituyeA,
  });

  if (errorInsert) {
    return { error: errorInsert.message };
  }

  await supabase.from("bitacora").insert({
    usuario_id: user.id,
    accion: "subida_documento",
    tabla_afectada: "documentos",
    registro_id: documentoId,
    detalle: { tipo, nombre_archivo: archivo.name, ruta_storage: ruta, sustituye_a: sustituyeA },
  });

  if (sustituyeA) {
    await supabase.from("documentos").update({ vigente: false }).eq("id", sustituyeA);
    await supabase.from("bitacora").insert({
      usuario_id: user.id,
      accion: "documento_sustituido",
      tabla_afectada: "documentos",
      registro_id: sustituyeA,
      detalle: { sustituido_por: documentoId },
    });
  }

  revalidatePath(`/sesiones/${sesionId}`);
  return { ok: true };
}
