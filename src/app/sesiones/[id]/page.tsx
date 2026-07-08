import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AsistenteForm from "./asistente-form";
import PuntoForm from "./punto-form";
import DocumentoForm from "./documento-form";
import AcuerdoForm from "./acuerdo-form";
import EstatusAcuerdoForm from "./estatus-acuerdo-form";
import ReporteBoton from "./reporte-boton";
import { semaforoAcuerdo, CLASES_SEMAFORO, ETIQUETAS_ESTATUS_ACUERDO } from "@/lib/semaforo";

const ETIQUETAS_TIPO: Record<string, string> = {
  ordinaria: "Ordinaria",
  extraordinaria: "Extraordinaria",
  instalacion: "Instalación",
};

const ETIQUETAS_TIPO_DOCUMENTO: Record<string, string> = {
  acta: "Acta",
  anexo: "Anexo",
  reporte_analisis: "Reporte de análisis",
  ficha_tecnica: "Ficha técnica",
};

export default async function DetalleSesionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sesion } = await supabase
    .from("sesiones")
    .select("id, numero_sesion, tipo, fecha, sede, hora_inicio, quorum_certificado, estatus, ooad_id, ooads(nombre)")
    .eq("id", id)
    .single();

  if (!sesion) {
    notFound();
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("rol, ooad_id")
    .eq("id", user.id)
    .single();

  const puedeEscribir =
    perfil?.rol === "admin_central" ||
    perfil?.rol === "analista_central" ||
    (perfil?.rol === "usuario_ooad" && perfil.ooad_id === sesion.ooad_id);

  const [{ data: asistentes }, { data: puntos }, { data: alertas }, { data: temas }, { data: documentos }] = await Promise.all([
    supabase.from("asistentes").select("id, nombre, cargo, parte, es_secretario_tecnico").eq("sesion_id", id).order("nombre"),
    supabase
      .from("puntos_sesion")
      .select("id, orden, texto_literal, temas_catalogo(tema, subtema)")
      .eq("sesion_id", id)
      .order("orden"),
    supabase
      .from("alertas_competencia")
      .select("id, clasificacion, justificacion, cita_literal, punto_sesion_id")
      .eq("sesion_id", id),
    supabase.from("temas_catalogo").select("id, tema, subtema").order("tema"),
    supabase
      .from("documentos")
      .select("id, tipo, nombre_archivo, vigente, fecha_subida")
      .eq("sesion_id", id)
      .order("fecha_subida", { ascending: false }),
  ]);

  const { data: acuerdosOoad } = await supabase
    .from("acuerdos")
    .select("id, sesion_id, texto_literal, fecha_compromiso, responsable, estatus, acuerdo_origen_id, sesiones!inner(numero_sesion, ooad_id)")
    .eq("sesiones.ooad_id", sesion.ooad_id);

  const acuerdosDeLaSesion = (acuerdosOoad ?? []).filter((a) => a.sesion_id === id);
  const posiblesOrigenes = (acuerdosOoad ?? [])
    .filter((a) => a.sesion_id !== id)
    .map((a) => {
      const s = a.sesiones as { numero_sesion: number } | { numero_sesion: number }[] | null;
      const info = Array.isArray(s) ? s[0] : s;
      return { id: a.id, texto_literal: a.texto_literal, numero_sesion: info?.numero_sesion ?? 0 };
    });
  const mapaAcuerdos = new Map((acuerdosOoad ?? []).map((a) => [a.id, a]));

  const ooad = sesion.ooads as { nombre: string } | { nombre: string }[] | null;
  const nombreOoad = Array.isArray(ooad) ? ooad[0]?.nombre : ooad?.nombre;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            {nombreOoad} · Sesión {sesion.numero_sesion}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {ETIQUETAS_TIPO[sesion.tipo] ?? sesion.tipo} · {sesion.fecha}
            {sesion.hora_inicio ? ` · ${sesion.hora_inicio}` : ""}
            {sesion.sede ? ` · ${sesion.sede}` : ""}
          </p>
          {!sesion.quorum_certificado && (
            <p className="mt-2 text-sm text-amber-600">Quórum no certificado</p>
          )}
        </div>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Asistentes</h2>
          <ul className="mb-4 flex flex-col gap-1 text-sm">
            {asistentes?.length ? (
              asistentes.map((a) => (
                <li key={a.id}>
                  {a.nombre}{a.cargo ? ` (${a.cargo})` : ""} · {a.parte === "imss" ? "IMSS" : "SNTSS"}
                  {a.es_secretario_tecnico ? " · Secretario Técnico" : ""}
                </li>
              ))
            ) : (
              <li className="text-zinc-600 dark:text-zinc-400">Sin asistentes registrados.</li>
            )}
          </ul>
          {puedeEscribir && <AsistenteForm sesionId={id} />}
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Orden del día</h2>
          <ol className="mb-4 flex flex-col gap-2 text-sm">
            {puntos?.length ? (
              puntos.map((p) => {
                const tema = p.temas_catalogo as { tema: string; subtema: string | null } | { tema: string; subtema: string | null }[] | null;
                const temaInfo = Array.isArray(tema) ? tema[0] : tema;
                const alertaDelPunto = alertas?.find((al) => al.punto_sesion_id === p.id);
                return (
                  <li key={p.id}>
                    <span className="font-medium">{p.orden}.</span> {p.texto_literal}
                    {temaInfo && (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {" "}
                        — {temaInfo.tema}
                        {temaInfo.subtema ? ` / ${temaInfo.subtema}` : ""}
                      </span>
                    )}
                    {alertaDelPunto && (
                      <p className="text-amber-600">
                        Alerta de competencia central
                        {alertaDelPunto.clasificacion ? ` (${alertaDelPunto.clasificacion})` : " (sin clasificar)"}
                      </p>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="text-zinc-600 dark:text-zinc-400">Sin puntos registrados.</li>
            )}
          </ol>
          {puedeEscribir && <PuntoForm sesionId={id} temas={temas ?? []} />}
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Acuerdos</h2>
          <ul className="mb-4 flex flex-col gap-3 text-sm">
            {acuerdosDeLaSesion.length ? (
              acuerdosDeLaSesion.map((a) => {
                const color = semaforoAcuerdo(a.estatus, a.fecha_compromiso);
                const origen = a.acuerdo_origen_id ? mapaAcuerdos.get(a.acuerdo_origen_id) : null;
                const origenSesionInfo = origen
                  ? (Array.isArray(origen.sesiones) ? origen.sesiones[0] : origen.sesiones)
                  : null;
                const seguidoPor = (acuerdosOoad ?? []).find((otro) => otro.acuerdo_origen_id === a.id);
                const seguidoPorSesionInfo = seguidoPor
                  ? (Array.isArray(seguidoPor.sesiones) ? seguidoPor.sesiones[0] : seguidoPor.sesiones)
                  : null;
                return (
                  <li key={a.id} className="rounded border border-zinc-200 p-2 dark:border-zinc-800">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${CLASES_SEMAFORO[color]}`} />
                      <div>
                        <p>{a.texto_literal}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Fecha compromiso: {a.fecha_compromiso ?? "no verificable"} · Responsable: {a.responsable ?? "no verificable"} · Estatus: {ETIQUETAS_ESTATUS_ACUERDO[a.estatus] ?? a.estatus}
                        </p>
                        {origen && (
                          <p className="text-zinc-600 dark:text-zinc-400">
                            Da seguimiento a: Sesión {origenSesionInfo?.numero_sesion} — {origen.texto_literal.slice(0, 60)}
                          </p>
                        )}
                        {seguidoPor && (
                          <p className="text-zinc-600 dark:text-zinc-400">
                            Seguido en: Sesión {seguidoPorSesionInfo?.numero_sesion} — {seguidoPor.texto_literal.slice(0, 60)}
                          </p>
                        )}
                        {puedeEscribir && <EstatusAcuerdoForm acuerdoId={a.id} sesionId={id} />}
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-zinc-600 dark:text-zinc-400">Sin acuerdos registrados.</li>
            )}
          </ul>
          {puedeEscribir && (
            <AcuerdoForm
              sesionId={id}
              puntos={(puntos ?? []).map((p) => ({ id: p.id, texto_literal: p.texto_literal }))}
              posiblesOrigenes={posiblesOrigenes}
            />
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">Documentos</h2>
          <ul className="mb-4 flex flex-col gap-1 text-sm">
            {documentos?.length ? (
              documentos.map((d) => (
                <li key={d.id}>
                  <a href={`/documentos/${d.id}/descargar`} className="underline">
                    {d.nombre_archivo}
                  </a>{" "}
                  · {ETIQUETAS_TIPO_DOCUMENTO[d.tipo] ?? d.tipo}
                  {!d.vigente && <span className="text-zinc-500"> (sustituido)</span>}
                </li>
              ))
            ) : (
              <li className="text-zinc-600 dark:text-zinc-400">Sin documentos registrados.</li>
            )}
          </ul>
          {puedeEscribir && (
            <DocumentoForm
              sesionId={id}
              documentosVigentes={(documentos ?? []).filter((d) => d.vigente).map((d) => ({ id: d.id, nombre_archivo: d.nombre_archivo, tipo: d.tipo }))}
            />
          )}
          {puedeEscribir && (
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <ReporteBoton sesionId={id} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
