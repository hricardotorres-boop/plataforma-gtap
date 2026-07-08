import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const ETIQUETAS_TIPO: Record<string, string> = {
  ordinaria: "Ordinaria",
  extraordinaria: "Extraordinaria",
  instalacion: "Instalación",
};

const ETIQUETAS_ESTATUS: Record<string, string> = {
  programada: "Programada",
  celebrada: "Celebrada",
  analizada: "Analizada",
};

export default async function SesionesPage({
  searchParams,
}: {
  searchParams: Promise<{ ooad_id?: string; anio?: string; tipo?: string; estatus?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("rol")
    .eq("id", user.id)
    .single();

  const puedeCrear = perfil?.rol === "admin_central" || perfil?.rol === "analista_central" || perfil?.rol === "usuario_ooad";

  const { data: ooads } = await supabase.from("ooads").select("id, nombre").order("nombre");

  let query = supabase
    .from("sesiones")
    .select("id, numero_sesion, tipo, fecha, estatus, quorum_certificado, ooads(nombre)")
    .order("fecha", { ascending: false });

  if (params.ooad_id) query = query.eq("ooad_id", params.ooad_id);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  if (params.estatus) query = query.eq("estatus", params.estatus);
  if (params.anio) {
    query = query.gte("fecha", `${params.anio}-01-01`).lte("fecha", `${params.anio}-12-31`);
  }

  const { data: sesiones } = await query;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Sesiones GTAP</h1>
          {puedeCrear && (
            <Link href="/sesiones/nueva" className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
              Nueva sesión
            </Link>
          )}
        </div>

        <form className="flex flex-wrap gap-3 text-sm" action="/sesiones">
          <select name="ooad_id" defaultValue={params.ooad_id ?? ""} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Todos los OOAD</option>
            {ooads?.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
          <input name="anio" type="number" placeholder="Año" defaultValue={params.anio ?? ""} className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
          <select name="tipo" defaultValue={params.tipo ?? ""} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Todos los tipos</option>
            <option value="ordinaria">Ordinaria</option>
            <option value="extraordinaria">Extraordinaria</option>
            <option value="instalacion">Instalación</option>
          </select>
          <select name="estatus" defaultValue={params.estatus ?? ""} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Todos los estatus</option>
            <option value="programada">Programada</option>
            <option value="celebrada">Celebrada</option>
            <option value="analizada">Analizada</option>
          </select>
          <button type="submit" className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700">Filtrar</button>
        </form>

        <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {sesiones?.length ? (
            sesiones.map((s) => {
              const ooad = s.ooads as { nombre: string } | { nombre: string }[] | null;
              const nombreOoad = Array.isArray(ooad) ? ooad[0]?.nombre : ooad?.nombre;
              return (
                <Link
                  key={s.id}
                  href={`/sesiones/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <span>
                    {nombreOoad} · Sesión {s.numero_sesion} ({ETIQUETAS_TIPO[s.tipo] ?? s.tipo}) · {s.fecha}
                    {!s.quorum_certificado && <span className="ml-2 text-amber-600">quórum no certificado</span>}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{ETIQUETAS_ESTATUS[s.estatus] ?? s.estatus}</span>
                </Link>
              );
            })
          ) : (
            <p className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-400">No hay sesiones registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
