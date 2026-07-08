"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function crearSesion(_prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa" };
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("rol, ooad_id")
    .eq("id", user.id)
    .single();

  const ooadId = perfil?.rol === "usuario_ooad" ? perfil.ooad_id : String(formData.get("ooad_id") ?? "");

  if (!ooadId) {
    return { error: "Selecciona un OOAD" };
  }

  const horaInicio = String(formData.get("hora_inicio") ?? "");

  const { data: nuevaSesion, error } = await supabase
    .from("sesiones")
    .insert({
      ooad_id: ooadId,
      numero_sesion: Number(formData.get("numero_sesion")),
      tipo: String(formData.get("tipo")),
      fecha: String(formData.get("fecha")),
      sede: String(formData.get("sede") ?? "") || null,
      hora_inicio: horaInicio || null,
      quorum_certificado: formData.get("quorum_certificado") === "on",
      estatus: String(formData.get("estatus") ?? "programada"),
      creado_por: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/sesiones/${nuevaSesion.id}`);
}

export async function agregarAsistente(sesionId: string, _prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("asistentes").insert({
    sesion_id: sesionId,
    nombre: String(formData.get("nombre")),
    cargo: String(formData.get("cargo") ?? "") || null,
    parte: String(formData.get("parte")),
    es_secretario_tecnico: formData.get("es_secretario_tecnico") === "on",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/sesiones/${sesionId}`);
  return { error: undefined };
}

export async function agregarPunto(sesionId: string, _prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient();

  const temaCatalogoId = String(formData.get("tema_catalogo_id") ?? "") || null;
  const textoLiteral = String(formData.get("texto_literal"));

  const { count } = await supabase
    .from("puntos_sesion")
    .select("id", { count: "exact", head: true })
    .eq("sesion_id", sesionId);

  const { data: puntoNuevo, error } = await supabase
    .from("puntos_sesion")
    .insert({
      sesion_id: sesionId,
      tema_catalogo_id: temaCatalogoId,
      texto_literal: textoLiteral,
      orden: (count ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (temaCatalogoId) {
    const { data: tema } = await supabase
      .from("temas_catalogo")
      .select("tema, subtema, competencia")
      .eq("id", temaCatalogoId)
      .single();

    if (tema?.competencia === "central") {
      await supabase.from("alertas_competencia").insert({
        sesion_id: sesionId,
        punto_sesion_id: puntoNuevo.id,
        clasificacion: null,
        justificacion:
          "Alerta generada automáticamente: el punto coincide con un tema de competencia central. Pendiente de clasificación manual (roja/naranja).",
        cita_literal: [tema.tema, tema.subtema].filter(Boolean).join(" / "),
      });
    }
  }

  revalidatePath(`/sesiones/${sesionId}`);
  return { error: undefined };
}
