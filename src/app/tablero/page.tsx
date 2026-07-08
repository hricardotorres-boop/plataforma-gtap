import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CLASES_SEMAFORO } from "@/lib/semaforo";
import { calcularIndicadoresOoad } from "@/lib/tablero";
import ExportarPdfBoton from "./exportar-pdf-boton";

export default async function TableroNacionalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: ooads }, { data: sesiones }, { data: acuerdos }, { data: alertas }] = await Promise.all([
    supabase.from("ooads").select("id, nombre, region, activo").order("region", { ascending: true, nullsFirst: false }).order("nombre"),
    supabase.from("sesiones").select("id, ooad_id, estatus"),
    supabase.from("acuerdos").select("id, estatus, fecha_compromiso, sesiones(ooad_id)"),
    supabase.from("alertas_competencia").select("id, clasificacion, sesiones(ooad_id)"),
  ]);

  const ooadIdDe = (rel: unknown) => {
    const s = rel as { ooad_id: string } | { ooad_id: string }[] | null;
    return Array.isArray(s) ? s[0]?.ooad_id : s?.ooad_id;
  };

  const filas = (ooads ?? []).map((o) => {
    const sesionesOoad = (sesiones ?? []).filter((s) => s.ooad_id === o.id);
    const acuerdosOoad = (acuerdos ?? []).filter((a) => ooadIdDe(a.sesiones) === o.id);
    const alertasOoad = (alertas ?? []).filter((a) => ooadIdDe(a.sesiones) === o.id);
    return { ooad: o, indicadores: calcularIndicadoresOoad(sesionesOoad, acuerdosOoad, alertasOoad) };
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Tablero nacional</h1>
          <div className="flex gap-2">
            <Link href="/tablero/alertas" className="print:hidden rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
              Alertas de competencia
            </Link>
            <ExportarPdfBoton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filas.map(({ ooad, indicadores }) => (
            <Link
              key={ooad.id}
              href={`/tablero/${ooad.id}`}
              className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${CLASES_SEMAFORO[indicadores.semaforo]}`} />
                <span className="font-medium">{ooad.nombre}</span>
                {ooad.region && <span className="text-zinc-500">({ooad.region})</span>}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Sesiones celebradas: {indicadores.sesionesCelebradas} · Acuerdos con fecha:{" "}
                {indicadores.pctAcuerdosConFecha === null ? "no verificable" : `${indicadores.pctAcuerdosConFecha}%`}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Acuerdos vencidos: {indicadores.acuerdosVencidos} · Alertas sin clasificar: {indicadores.alertasSinClasificar}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
