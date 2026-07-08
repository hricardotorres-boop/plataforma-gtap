"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(iniciarSesion, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 p-8 dark:border-zinc-800"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Plataforma GTAP
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Iniciar sesión</p>

        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            name="email"
            type="email"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>

        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/registro">Crear cuenta</Link>
          <Link href="/recuperar">Olvidé mi contraseña</Link>
        </div>
      </form>
    </div>
  );
}
