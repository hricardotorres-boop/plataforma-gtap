"use client";

import { useActionState } from "react";
import { cambiarEstatusAcuerdo } from "../acuerdo-actions";

export default function EstatusAcuerdoForm({ acuerdoId, sesionId }: { acuerdoId: string; sesionId: string }) {
  const cambiarConIds = cambiarEstatusAcuerdo.bind(null, acuerdoId, sesionId);
  const [state, formAction, pending] = useActionState(cambiarConIds, null);

  return (
    <form action={formAction} className="mt-1 flex flex-wrap items-end gap-2 text-xs">
      <label className="flex flex-col gap-1">
        Nuevo estatus
        <select name="estatus" required className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
          <option value="vigente">Vigente</option>
          <option value="cumplido">Cumplido</option>
          <option value="incumplido">Incumplido</option>
          <option value="sin_seguimiento">Sin seguimiento</option>
          <option value="no_verificable">No verificable</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Justificación (obligatoria)
        <input name="justificacion" type="text" required className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>
      <button type="submit" disabled={pending} className="rounded border border-zinc-400 px-2 py-1 dark:border-zinc-600">
        {pending ? "Guardando..." : "Cambiar estatus"}
      </button>
      {state?.error && <p className="w-full text-red-600">{state.error}</p>}
    </form>
  );
}
