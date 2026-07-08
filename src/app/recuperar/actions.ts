"use server";

import { createClient } from "@/lib/supabase/server";

export async function solicitarRecuperacion(
  _prevState: { error?: string; ok?: boolean } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "");
  const origen = String(formData.get("origen") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/auth/callback?next=/actualizar-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
