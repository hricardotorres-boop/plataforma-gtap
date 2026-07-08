"use client";

import { useActionState } from "react";
import { actualizarPassword } from "./actions";

export default function ActualizarPasswordPage() {
  const [state, formAction, pending] = useActionState(actualizarPassword, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 p-8 dark:border-zinc-800"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Nueva contraseña
        </h1>

        <label className="flex flex-col gap-1 text-sm">
          Contraseña nueva
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
