import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExportarPdfBoton from "../exportar-pdf-boton";

export default async function AlertasCompetenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ ooad_id?: string; clasificacion?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ooads } = await supabase.from("ooads").select("id, nombre").order("nombre");

  let query = supabase
    .from("alertas_competencia")
    .select("id, clasificacion, justificacion, cita_literal, sesion_id, sesiones!inner(numero_sesion, fecha, ooad_id, ooads(nombre))");

  if (params.ooad_id) query = query.eq("sesiones.ooad_id", params.ooad_id);
  if (params.clasificacion === "sin_clasificar") {
    query = query.is("clasificacion", null);
  } else if (params.clasificacion) {
    query = query.eq("clasificacion", params.clasificacion);
  }

  const { data: alertas } = await query;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Alertas de competencia</h1>
          <div className="flex gap-2">
            <Link href="/tablero" className="print:hidden rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
              Volver al tablero
            </Link>
            <ExportarPdfBoton />
          </div>
        </div>

        <form className="print:hidden flex gap-3 text-sm" action="/tablero/alertas">
          <select name="ooad_id" defaultValue={params.ooad_id ?? ""} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Todos los OOAD</option>
            {ooads?.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
          <select name="clasificacion" defaultValue={params.clasificacion ?? ""} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Todas las clasificaciones</option>
            <option value="roja">Roja</option>
            <option value="naranja">Naranja</option>
            <option value="sin_clasificar">Sin clasificar</option>
          </select>
          <button type="submit" className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700">Filtrar</button>
        </form>

        <ul className="flex flex-col gap-3">
          {alertas?.length ? (
            alertas.map((a) => {
              const sesionInfo = a.sesiones as
                | { numero_sesion: number; fecha: string; ooads: { nombre: string } | { nombre: string }[] | null }
                | { numero_sesion: number; fecha: string; ooads: { nombre: string } | { nombre: string }[] | null }[]
                | null;
              const info = Array.isArray(sesionInfo) ? sesionInfo[0] : sesionInfo;
              const ooadInfo = info?.ooads as { nombre: string } | { nombre: string }[] | null;
              const nombreOoad = Array.isArray(ooadInfo) ? ooadInfo[0]?.nombre : ooadInfo?.nombre;
              return (
                <li key={a.id} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {nombreOoad} · Sesión {info?.numero_sesion} ({info?.fecha}) ·{" "}
                    <Link href={`/sesiones/${a.sesion_id}`} className="print:hidden underline">ver sesión</Link>
                  </p>
                  <p className="font-medium">
                    {a.clasificacion ? `Clasificación: ${a.clasificacion}` : "Sin clasificar"}
                  </p>
                  <p>{a.cita_literal}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">{a.justificacion}</p>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-zinc-600 dark:text-zinc-400">Sin alertas registradas.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
