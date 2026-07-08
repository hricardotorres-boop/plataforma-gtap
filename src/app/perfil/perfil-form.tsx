"use client";

import { useActionState } from "react";
import { actualizarPerfil } from "./actions";

export default function PerfilForm({ nombreCompletoInicial }: { nombreCompletoInicial: string }) {
  const [state, formAction, pending] = useActionState(actualizarPerfil, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Nombre completo
        <input
          name="nombre_completo"
          type="text"
          defaultValue={nombreCompletoInicial}
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Perfil actualizado</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
