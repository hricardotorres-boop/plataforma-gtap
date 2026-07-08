import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { semaforoAcuerdo, CLASES_SEMAFORO, ETIQUETAS_ESTATUS_ACUERDO } from "@/lib/semaforo";
import ExportarPdfBoton from "../exportar-pdf-boton";

const ETIQUETAS_TIPO: Record<string, string> = {
  ordinaria: "Ordinaria",
  extraordinaria: "Extraordinaria",
  instalacion: "Instalación",
};

export default async function TableroOoadPage({ params }: { params: Promise<{ ooadId: string }> }) {
  const { ooadId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ooad } = await supabase.from("ooads").select("id, nombre, region").eq("id", ooadId).single();
  if (!ooad) {
    notFound();
  }

  const { data: sesiones } = await supabase
    .from("sesiones")
    .select("id, numero_sesion, tipo, fecha, estatus, quorum_certificado, puntos_sesion(id, texto_literal, temas_catalogo(tema, subtema))")
    .eq("ooad_id", ooadId)
    .order("fecha");

  const { data: acuerdos } = await supabase
    .from("acuerdos")
    .select("id, sesion_id, texto_literal, fecha_compromiso, responsable, estatus, sesiones!inner(numero_sesion, ooad_id)")
    .eq("sesiones.ooad_id", ooadId);

  const totalSesiones = sesiones?.length ?? 0;
  const sesionesConQuorum = (sesiones ?? []).filter((s) => s.quorum_certificado).length;
  const pctQuorum = totalSesiones ? Math.round((sesionesConQuorum / totalSesiones) * 100) : null;

  const totalAcuerdos = acuerdos?.length ?? 0;
  const acuerdosConFechaYResponsable = (acuerdos ?? []).filter((a) => a.fecha_compromiso && a.responsable).length;
  const pctCompletos = totalAcuerdos ? Math.round((acuerdosConFechaYResponsable / totalAcuerdos) * 100) : null;
  const acuerdosCumplidos = (acuerdos ?? []).filter((a) => a.estatus === "cumplido").length;
  const pctCumplidos = totalAcuerdos ? Math.round((acuerdosCumplidos / totalAcuerdos) * 100) : null;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{ooad.nombre}</h1>
            {ooad.region && <p className="text-sm text-zinc-600 dark:text-zinc-400">Región {ooad.region}</p>}
          </div>
          <div className="flex gap-2">
            <Link href="/tablero" className="print:hidden rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
              Volver al tablero
            </Link>
            <ExportarPdfBoton />
          </div>
        </div>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Indicadores de madurez operativa</h2>
          <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Sesiones con quórum certificado: {pctQuorum === null ? "no verificable" : `${pctQuorum}%`} ({sesionesConQuorum}/{totalSesiones})</li>
            <li>Acuerdos con fecha compromiso y responsable: {pctCompletos === null ? "no verificable" : `${pctCompletos}%`} ({acuerdosConFechaYResponsable}/{totalAcuerdos})</li>
            <li>Acuerdos cumplidos: {pctCumplidos === null ? "no verificable" : `${pctCumplidos}%`} ({acuerdosCumplidos}/{totalAcuerdos})</li>
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Línea de tiempo de sesiones y evolución temática</h2>
          <ol className="flex flex-col gap-3 text-sm">
            {sesiones?.length ? (
              sesiones.map((s) => (
                <li key={s.id}>
                  <p className="font-medium">
                    Sesión {s.numero_sesion} ({ETIQUETAS_TIPO[s.tipo] ?? s.tipo}) · {s.fecha} · {s.estatus}
                    {!s.quorum_certificado && <span className="text-amber-600"> · quórum no certificado</span>}
                  </p>
                  <ul className="ml-4 list-disc text-zinc-600 dark:text-zinc-400">
                    {(s.puntos_sesion ?? []).length ? (
                      s.puntos_sesion.map((p) => {
                        const tema = p.temas_catalogo as { tema: string; subtema: string | null } | { tema: string; subtema: string | null }[] | null;
                        const info = Array.isArray(tema) ? tema[0] : tema;
                        return <li key={p.id}>{info ? `${info.tema}${info.subtema ? ` / ${info.subtema}` : ""}` : p.texto_literal}</li>;
                      })
                    ) : (
                      <li>Sin puntos registrados.</li>
                    )}
                  </ul>
                </li>
              ))
            ) : (
              <li className="text-zinc-600 dark:text-zinc-400">Sin sesiones registradas.</li>
            )}
          </ol>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Acuerdos vivos</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {acuerdos?.length ? (
              acuerdos.map((a) => {
                const color = semaforoAcuerdo(a.estatus, a.fecha_compromiso);
                const sesionInfo = a.sesiones as { numero_sesion: number } | { numero_sesion: number }[] | null;
                const info = Array.isArray(sesionInfo) ? sesionInfo[0] : sesionInfo;
                return (
                  <li key={a.id} className="flex items-start gap-2">
                    <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${CLASES_SEMAFORO[color]}`} />
                    <span>
                      Sesión {info?.numero_sesion}: {a.texto_literal} · {ETIQUETAS_ESTATUS_ACUERDO[a.estatus] ?? a.estatus}
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="text-zinc-600 dark:text-zinc-400">Sin acuerdos registrados.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
