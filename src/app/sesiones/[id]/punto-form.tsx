"use client";

import { useActionState } from "react";
import { agregarPunto } from "../actions";

export default function PuntoForm({
  sesionId,
  temas,
}: {
  sesionId: string;
  temas: { id: string; tema: string; subtema: string | null }[];
}) {
  const agregarConSesion = agregarPunto.bind(null, sesionId);
  const [state, formAction, pending] = useActionState(agregarConSesion, null);

  return (
    <form action={formAction} className="flex flex-col gap-2 text-sm">
      <label className="flex flex-col gap-1">
        Tema del catálogo (opcional)
        <select name="tema_catalogo_id" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
          <option value="">Fuera de catálogo</option>
          {temas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tema}{t.subtema ? ` / ${t.subtema}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Texto literal del punto
        <textarea name="texto_literal" required rows={2} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>
      <button type="submit" disabled={pending} className="self-start rounded bg-black px-3 py-1 text-white disabled:opacity-50 dark:bg-white dark:text-black">
        {pending ? "Agregando..." : "Agregar punto"}
      </button>
      {state?.error && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
