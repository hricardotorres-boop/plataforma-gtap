"use client";

import { useActionState } from "react";
import { generarReporte } from "../reporte-actions";

export default function ReporteBoton({ sesionId }: { sesionId: string }) {
  const generarConSesion = generarReporte.bind(null, sesionId);
  const [state, formAction, pending] = useActionState(generarConSesion, null);

  return (
    <form action={formAction} className="flex items-center gap-2 text-sm">
      <button type="submit" disabled={pending} className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-50 dark:border-zinc-700">
        {pending ? "Generando..." : "Generar reporte de esta sesión"}
      </button>
      {state?.ok && <span className="text-green-600">Reporte generado, disponible abajo en Documentos.</span>}
      {state?.error && <span className="text-red-600">{state.error}</span>}
    </form>
  );
}
