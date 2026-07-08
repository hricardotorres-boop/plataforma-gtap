import { semaforoAcuerdo, type SemaforoColor } from "./semaforo";

export type IndicadoresOoad = {
  sesionesCelebradas: number;
  pctAcuerdosConFecha: number | null;
  acuerdosVencidos: number;
  alertasSinClasificar: number;
  semaforo: SemaforoColor;
};

export function calcularIndicadoresOoad(
  sesiones: { estatus: string }[],
  acuerdos: { estatus: string; fecha_compromiso: string | null }[],
  alertas: { clasificacion: string | null }[],
): IndicadoresOoad {
  const sesionesCelebradas = sesiones.filter((s) => s.estatus === "celebrada" || s.estatus === "analizada").length;
  const conFecha = acuerdos.filter((a) => a.fecha_compromiso).length;
  const pctAcuerdosConFecha = acuerdos.length ? Math.round((conFecha / acuerdos.length) * 100) : null;
  const acuerdosVencidos = acuerdos.filter((a) => semaforoAcuerdo(a.estatus, a.fecha_compromiso) === "rojo").length;
  const alertasSinClasificar = alertas.filter((a) => !a.clasificacion).length;

  let semaforo: SemaforoColor;
  if (sesiones.length === 0) {
    semaforo = "gris";
  } else if (acuerdosVencidos > 0 || alertasSinClasificar > 0) {
    semaforo = "rojo";
  } else if (acuerdos.some((a) => !a.fecha_compromiso && a.estatus !== "cumplido")) {
    semaforo = "amarillo";
  } else {
    semaforo = "verde";
  }

  return { sesionesCelebradas, pctAcuerdosConFecha, acuerdosVencidos, alertasSinClasificar, semaforo };
}
