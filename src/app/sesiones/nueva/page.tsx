import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SesionForm from "./sesion-form";

export default async function NuevaSesionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("rol, ooad_id, ooads(nombre)")
    .eq("id", user.id)
    .single();

  const esCentral = perfil?.rol === "admin_central" || perfil?.rol === "analista_central";

  let ooads: { id: string; nombre: string }[] = [];
  if (esCentral) {
    const { data } = await supabase.from("ooads").select("id, nombre").order("nombre");
    ooads = data ?? [];
  }

  const ooadPropio = perfil?.ooads as { nombre: string } | { nombre: string }[] | null;
  const nombreOoadPropio = Array.isArray(ooadPropio) ? ooadPropio[0]?.nombre : ooadPropio?.nombre;

  if (perfil?.rol === "consulta") {
    redirect("/sesiones");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <SesionForm ooads={ooads} nombreOoadPropio={esCentral ? null : (nombreOoadPropio ?? null)} />
    </div>
  );
}
