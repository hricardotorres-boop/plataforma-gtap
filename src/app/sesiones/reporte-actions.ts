"use server";

import { createClient } from "@/lib/supabase/server";
import { construirReporteDocx, type ReporteSesionData, type ReporteComparativoSesion } from "@/lib/reporte-docx";
import { semaforoAcuerdo } from "@/lib/semaforo";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function generarReporte(sesionId: string, _prevState: { error?: string; ok?: boolean } | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa" };
  }

  const { data: sesion } = await supabase
    .from("sesiones")
    .select("id, numero_sesion, tipo, fecha, sede, quorum_certificado, ooad_id, ooads(nombre)")
    .eq("id", sesionId)
    .single();

  if (!sesion) {
    return { error: "Sesión no encontrada" };
  }

  const ooadNombreRaw = sesion.ooads as { nombre: string } | { nombre: string }[] | null;
  const ooadNombre = (Array.isArray(ooadNombreRaw) ? ooadNombreRaw[0]?.nombre : ooadNombreRaw?.nombre) ?? "OOAD";

  const [{ data: asistentes }, { data: puntos }, { data: acuerdos }, { data: alertas }] = await Promise.all([
    supabase.from("asistentes").select("nombre, cargo, parte, es_secretario_tecnico").eq("sesion_id", sesionId),
    supabase.from("puntos_sesion").select("id", { count: "exact" }).eq("sesion_id", sesionId),
    supabase
      .from("acuerdos")
      .select("id, texto_literal, fecha_compromiso, responsable, estatus, acuerdo_origen_id")
      .eq("sesion_id", sesionId),
    supabase.from("alertas_competencia").select("clasificacion, justificacion, cita_literal").eq("sesion_id", sesionId),
  ]);

  // Resolver texto/sesión de origen para acuerdos con seguimiento
  const origenIds = (acuerdos ?? []).map((a) => a.acuerdo_origen_id).filter((id): id is string => !!id);
  let origenes = new Map<string, { texto: string; numeroSesion: number }>();
  if (origenIds.length) {
    const { data: origenesData } = await supabase
      .from("acuerdos")
      .select("id, texto_literal, sesiones(numero_sesion)")
      .in("id", origenIds);
    origenes = new Map(
      (origenesData ?? []).map((o) => {
        const s = o.sesiones as { numero_sesion: number } | { numero_sesion: number }[] | null;
        const info = Array.isArray(s) ? s[0] : s;
        return [o.id, { texto: o.texto_literal, numeroSesion: info?.numero_sesion ?? 0 }];
      }),
    );
  }

  // Comparativo intersesiones: solo si hay 3 o más sesiones del mismo OOAD hasta esta fecha
  const { data: sesionesOoad } = await supabase
    .from("sesiones")
    .select("id, numero_sesion, fecha, quorum_certificado")
    .eq("ooad_id", sesion.ooad_id)
    .lte("fecha", sesion.fecha)
    .order("fecha");

  let comparativo: ReporteSesionData["comparativo"] = null;
  if ((sesionesOoad ?? []).length >= 3) {
    const idsSesiones = (sesionesOoad ?? []).map((s) => s.id);
    const [{ data: acuerdosComparativo }, { data: alertasComparativo }, { data: puntosComparativo }] = await Promise.all([
      supabase.from("acuerdos").select("sesion_id, estatus, fecha_compromiso").in("sesion_id", idsSesiones),
      supabase.from("alertas_competencia").select("sesion_id, clasificacion").in("sesion_id", idsSesiones),
      supabase.from("puntos_sesion").select("sesion_id, temas_catalogo(tema)").in("sesion_id", idsSesiones),
    ]);

    const sesionesComparativo: ReporteComparativoSesion[] = (sesionesOoad ?? []).map((s) => {
      const acuerdosDeSesion = (acuerdosComparativo ?? []).filter((a) => a.sesion_id === s.id);
      const conFecha = acuerdosDeSesion.filter((a) => a.fecha_compromiso).length;
      const cumplidos = acuerdosDeSesion.filter((a) => a.estatus === "cumplido").length;
      return {
        numeroSesion: s.numero_sesion,
        fecha: s.fecha,
        quorumCertificado: s.quorum_certificado,
        totalAcuerdos: acuerdosDeSesion.length,
        pctConFecha: acuerdosDeSesion.length ? Math.round((conFecha / acuerdosDeSesion.length) * 100) : null,
        pctCumplidos: acuerdosDeSesion.length ? Math.round((cumplidos / acuerdosDeSesion.length) * 100) : null,
      };
    });

    const temasPorSesion = new Map<string, Set<number>>();
    (puntosComparativo ?? []).forEach((p) => {
      const tema = p.temas_catalogo as { tema: string } | { tema: string }[] | null;
      const nombreTema = Array.isArray(tema) ? tema[0]?.tema : tema?.tema;
      if (!nombreTema) return;
      const numeroSesion = (sesionesOoad ?? []).find((s) => s.id === p.sesion_id)?.numero_sesion;
      if (!numeroSesion) return;
      if (!temasPorSesion.has(nombreTema)) temasPorSesion.set(nombreTema, new Set());
      temasPorSesion.get(nombreTema)!.add(numeroSesion);
    });
    const evolucionTematica = Array.from(temasPorSesion.entries()).map(([tema, numeros]) => ({
      tema,
      numerosSesion: Array.from(numeros).sort((a, b) => a - b),
    }));

    const totalAcuerdos = (acuerdosComparativo ?? []).length;
    const conFechaTotal = (acuerdosComparativo ?? []).filter((a) => a.fecha_compromiso).length;
    const vencidosTotal = (acuerdosComparativo ?? []).filter((a) => semaforoAcuerdo(a.estatus, a.fecha_compromiso) === "rojo").length;
    const sinClasificarTotal = (alertasComparativo ?? []).filter((a) => !a.clasificacion).length;

    comparativo = {
      sesiones: sesionesComparativo,
      evolucionTematica,
      sintesis: {
        totalAcuerdos,
        pctConFecha: totalAcuerdos ? Math.round((conFechaTotal / totalAcuerdos) * 100) : null,
        acuerdosVencidos: vencidosTotal,
        alertasSinClasificar: sinClasificarTotal,
      },
    };
  }

  const datos: ReporteSesionData = {
    ooadNombre,
    numeroSesion: sesion.numero_sesion,
    tipo: sesion.tipo,
    fecha: sesion.fecha,
    sede: sesion.sede,
    quorumCertificado: sesion.quorum_certificado,
    totalPuntos: puntos?.length ?? 0,
    asistentes: (asistentes ?? []).map((a) => ({
      nombre: a.nombre,
      cargo: a.cargo,
      parte: a.parte,
      esSecretarioTecnico: a.es_secretario_tecnico,
    })),
    acuerdos: (acuerdos ?? []).map((a) => {
      const origen = a.acuerdo_origen_id ? origenes.get(a.acuerdo_origen_id) : null;
      return {
        texto: a.texto_literal,
        fechaCompromiso: a.fecha_compromiso,
        responsable: a.responsable,
        estatus: a.estatus,
        origenTexto: origen?.texto ?? null,
        origenNumeroSesion: origen?.numeroSesion ?? null,
      };
    }),
    alertas: (alertas ?? []).map((a) => ({
      clasificacion: a.clasificacion,
      citaLiteral: a.cita_literal,
      justificacion: a.justificacion,
    })),
    comparativo,
  };

  const buffer = await construirReporteDocx(datos);
  const documentoId = randomUUID();
  const nombreArchivo = `reporte_sesion_${sesion.numero_sesion}.docx`;
  const ruta = `ooad_${sesion.ooad_id}/sesion_${sesionId}/${documentoId}_${nombreArchivo}`;

  const { error: errorSubida } = await supabase.storage.from("reportes").upload(ruta, buffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  if (errorSubida) {
    return { error: errorSubida.message };
  }

  const { error: errorInsert } = await supabase.from("documentos").insert({
    id: documentoId,
    sesion_id: sesionId,
    tipo: "reporte_analisis",
    nombre_archivo: nombreArchivo,
    ruta_storage: ruta,
    subido_por: user.id,
    vigente: true,
  });

  if (errorInsert) {
    return { error: errorInsert.message };
  }

  await supabase.from("bitacora").insert({
    usuario_id: user.id,
    accion: "generacion_reporte",
    tabla_afectada: "documentos",
    registro_id: documentoId,
    detalle: { tipo: "reporte_analisis", nombre_archivo: nombreArchivo, con_comparativo: !!comparativo },
  });

  revalidatePath(`/sesiones/${sesionId}`);
  return { ok: true };
}
