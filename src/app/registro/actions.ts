"use server";

import { createClient } from "@/lib/supabase/server";

export async function registrarse(_prevState: { error?: string; ok?: boolean } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nombreCompleto = String(formData.get("nombre_completo") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre_completo: nombreCompleto } },
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
