"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function actualizarPassword(
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
