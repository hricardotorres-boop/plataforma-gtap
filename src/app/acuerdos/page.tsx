import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { semaforoAcuerdo, CLASES_SEMAFORO, ETIQUETAS_ESTATUS_ACUERDO } from "@/lib/semaforo";

export default async function AcuerdosPage({
  searchParams,
}: {
  searchParams: Promise<{ ooad_id?: string }>;
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
    .from("acuerdos")
    .select(
      "id, sesion_id, texto_literal, fecha_compromiso, responsable, estatus, acuerdo_origen_id, sesiones(numero_sesion, fecha, ooads(nombre))",
    );

  if (params.ooad_id) {
    query = query.eq("sesiones.ooad_id", params.ooad_id);
  }

  const { data: acuerdos } = await query;
  const mapaAcuerdos = new Map((acuerdos ?? []).map((a) => [a.id, a]));

  const ordenados = [...(acuerdos ?? [])].sort((a, b) => {
    if (!a.fecha_compromiso) return 1;
    if (!b.fecha_compromiso) return -1;
    return a.fecha_compromiso.localeCompare(b.fecha_compromiso);
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Acuerdos vivos</h1>

        <form className="flex gap-3 text-sm" action="/acuerdos">
          <select name="ooad_id" defaultValue={params.ooad_id ?? ""} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Todos los OOAD</option>
            {ooads?.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
          <button type="submit" className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700">Filtrar</button>
        </form>

        <ul className="flex flex-col gap-3">
          {ordenados.length ? (
            ordenados.map((a) => {
              const color = semaforoAcuerdo(a.estatus, a.fecha_compromiso);
              const sesionInfo = a.sesiones as
                | { numero_sesion: number; fecha: string; ooads: { nombre: string } | { nombre: string }[] | null }
                | { numero_sesion: number; fecha: string; ooads: { nombre: string } | { nombre: string }[] | null }[]
                | null;
              const info = Array.isArray(sesionInfo) ? sesionInfo[0] : sesionInfo;
              const ooadInfo = info?.ooads as { nombre: string } | { nombre: string }[] | null;
              const nombreOoad = Array.isArray(ooadInfo) ? ooadInfo[0]?.nombre : ooadInfo?.nombre;
              const origen = a.acuerdo_origen_id ? mapaAcuerdos.get(a.acuerdo_origen_id) : null;
              return (
                <li key={a.id} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${CLASES_SEMAFORO[color]}`} />
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {nombreOoad} · Sesión {info?.numero_sesion} ({info?.fecha}) ·{" "}
                        <Link href={`/sesiones/${a.sesion_id}`} className="underline">ver sesión</Link>
                      </p>
                      <p>{a.texto_literal}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        Fecha compromiso: {a.fecha_compromiso ?? "no verificable"} · Responsable: {a.responsable ?? "no verificable"} · Estatus: {ETIQUETAS_ESTATUS_ACUERDO[a.estatus] ?? a.estatus}
                      </p>
                      {origen && <p className="text-zinc-600 dark:text-zinc-400">Da seguimiento a un acuerdo de sesión anterior.</p>}
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-zinc-600 dark:text-zinc-400">Sin acuerdos registrados.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
