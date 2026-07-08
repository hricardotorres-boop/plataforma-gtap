import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cerrarSesion } from "./actions";
import PerfilForm from "./perfil-form";

const ETIQUETAS_ROL: Record<string, string> = {
  admin_central: "Administrador central",
  analista_central: "Analista central",
  usuario_ooad: "Usuario OOAD",
  consulta: "Consulta",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("nombre_completo, rol, ooads(nombre)")
    .eq("id", user.id)
    .single();

  const ooad = perfil?.ooads as { nombre: string } | { nombre: string }[] | null;
  const nombreOoad = Array.isArray(ooad) ? ooad[0]?.nombre : ooad?.nombre;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 p-8 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Mi perfil</h1>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">Correo: {user.email}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Rol: {perfil ? ETIQUETAS_ROL[perfil.rol] ?? perfil.rol : "no verificable"}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          OOAD: {nombreOoad ?? "sin asignar (ámbito central)"}
        </p>

        <PerfilForm nombreCompletoInicial={perfil?.nombre_completo ?? ""} />

        <form action={cerrarSesion}>
          <button type="submit" className="text-sm underline">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
