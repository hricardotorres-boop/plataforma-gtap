export type SemaforoColor = "verde" | "amarillo" | "rojo" | "gris";

export function semaforoAcuerdo(estatus: string, fechaCompromiso: string | null): SemaforoColor {
  if (estatus === "cumplido") return "verde";
  if (!fechaCompromiso || estatus === "no_verificable") return "gris";
  const hoy = new Date().toISOString().slice(0, 10);
  if (fechaCompromiso < hoy) return "rojo";
  return "amarillo";
}

export const CLASES_SEMAFORO: Record<SemaforoColor, string> = {
  verde: "bg-green-500",
  amarillo: "bg-amber-400",
  rojo: "bg-red-500",
  gris: "bg-zinc-400",
};

export const ETIQUETAS_ESTATUS_ACUERDO: Record<string, string> = {
  vigente: "Vigente",
  cumplido: "Cumplido",
  incumplido: "Incumplido",
  sin_seguimiento: "Sin seguimiento",
  no_verificable: "No verificable",
};
