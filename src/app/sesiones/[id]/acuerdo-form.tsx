"use client";

import { useActionState } from "react";
import { crearAcuerdo } from "../acuerdo-actions";

export default function AcuerdoForm({
  sesionId,
  puntos,
  posiblesOrigenes,
}: {
  sesionId: string;
  puntos: { id: string; texto_literal: string }[];
  posiblesOrigenes: { id: string; texto_literal: string; numero_sesion: number }[];
}) {
  const crearConSesion = crearAcuerdo.bind(null, sesionId);
  const [state, formAction, pending] = useActionState(crearConSesion, null);

  return (
    <form action={formAction} className="flex flex-col gap-2 text-sm">
      {puntos.length > 0 && (
        <label className="flex flex-col gap-1">
          Punto del orden del día (opcional)
          <select name="punto_sesion_id" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Sin vincular</option>
            {puntos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.texto_literal.slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        Texto literal del acuerdo
        <textarea name="texto_literal" required rows={2} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <label className="flex flex-col gap-1">
        Fecha compromiso (opcional)
        <input name="fecha_compromiso" type="date" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <label className="flex flex-col gap-1">
        Responsable (opcional)
        <input name="responsable" type="text" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      {posiblesOrigenes.length > 0 && (
        <label className="flex flex-col gap-1">
          Da seguimiento a (opcional)
          <select name="acuerdo_origen_id" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Acuerdo nuevo</option>
            {posiblesOrigenes.map((a) => (
              <option key={a.id} value={a.id}>
                Sesión {a.numero_sesion}: {a.texto_literal.slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
      )}

      {state?.error && <p className="text-red-600">{state.error}</p>}

      <button type="submit" disabled={pending} className="self-start rounded bg-black px-3 py-1 text-white disabled:opacity-50 dark:bg-white dark:text-black">
        {pending ? "Guardando..." : "Agregar acuerdo"}
      </button>
    </form>
  );
}
