"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function actualizarPerfil(
  _prevState: { error?: string; ok?: boolean } | null,
  formData: FormData,
) {
  const nombreCompleto = String(formData.get("nombre_completo") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa" };
  }

  const { error } = await supabase
    .from("usuarios_perfil")
    .update({ nombre_completo: nombreCompleto })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/perfil");
  return { ok: true };
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
