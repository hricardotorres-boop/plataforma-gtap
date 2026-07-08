"use client";

import { useActionState } from "react";
import { agregarAsistente } from "../actions";

export default function AsistenteForm({ sesionId }: { sesionId: string }) {
  const agregarConSesion = agregarAsistente.bind(null, sesionId);
  const [state, formAction, pending] = useActionState(agregarConSesion, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 text-sm">
      <label className="flex flex-col gap-1">
        Nombre
        <input name="nombre" type="text" required className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>
      <label className="flex flex-col gap-1">
        Cargo
        <input name="cargo" type="text" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>
      <label className="flex flex-col gap-1">
        Parte
        <select name="parte" required className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
          <option value="imss">IMSS</option>
          <option value="sntss">SNTSS</option>
        </select>
      </label>
      <label className="flex items-center gap-1">
        <input name="es_secretario_tecnico" type="checkbox" />
        Secretario Técnico
      </label>
      <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 dark:bg-white dark:text-black">
        {pending ? "Agregando..." : "Agregar"}
      </button>
      {state?.error && <p className="w-full text-red-600">{state.error}</p>}
    </form>
  );
}
