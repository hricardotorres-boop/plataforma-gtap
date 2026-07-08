"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearAcuerdo(sesionId: string, _prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient();

  const puntoSesionId = String(formData.get("punto_sesion_id") ?? "") || null;
  const acuerdoOrigenId = String(formData.get("acuerdo_origen_id") ?? "") || null;
  const fechaCompromiso = String(formData.get("fecha_compromiso") ?? "") || null;
  const responsable = String(formData.get("responsable") ?? "") || null;

  const { error } = await supabase.from("acuerdos").insert({
    sesion_id: sesionId,
    punto_sesion_id: puntoSesionId,
    texto_literal: String(formData.get("texto_literal")),
    fecha_compromiso: fechaCompromiso,
    responsable,
    acuerdo_origen_id: acuerdoOrigenId,
    estatus: "sin_seguimiento",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/sesiones/${sesionId}`);
  revalidatePath("/acuerdos");
  return { error: undefined };
}

export async function cambiarEstatusAcuerdo(
  acuerdoId: string,
  sesionId: string,
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa" };
  }

  const { error } = await supabase.rpc("set_acuerdo_estatus", {
    p_acuerdo_id: acuerdoId,
    p_nuevo_estatus: String(formData.get("estatus")),
    p_justificacion: String(formData.get("justificacion")),
    p_usuario_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/sesiones/${sesionId}`);
  revalidatePath("/acuerdos");
  return { error: undefined };
}
