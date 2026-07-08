"use client";

import { useActionState, useState } from "react";
import { confirmarPuntosOrdenDia } from "../documento-actions";

export default function RevisionPuntosForm({ sesionId, candidatos }: { sesionId: string; candidatos: string[] }) {
  const confirmarConSesion = confirmarPuntosOrdenDia.bind(null, sesionId);
  const [state, formAction, pending] = useActionState(confirmarConSesion, null);
  const [textos, setTextos] = useState(candidatos);

  if (state?.ok) {
    return <p className="text-sm text-green-600">Puntos agregados al orden del día.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border border-amber-400 p-3 text-sm">
      <p className="font-medium">
        Se detectaron posibles puntos del orden del día en el acta. Revisa, edita y confirma cuáles agregar (nada se guarda automáticamente).
      </p>
      {textos.map((texto, i) => (
        <label key={i} className="flex items-start gap-2">
          <input type="checkbox" name="punto_incluido" value={i} defaultChecked className="mt-2" />
          <textarea
            name="punto_texto"
            value={texto}
            onChange={(e) => setTextos((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))}
            rows={2}
            className="flex-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      ))}
      {state?.error && <p className="text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="self-start rounded bg-black px-3 py-1 text-white disabled:opacity-50 dark:bg-white dark:text-black">
        {pending ? "Guardando..." : "Confirmar puntos seleccionados"}
      </button>
    </form>
  );
}
