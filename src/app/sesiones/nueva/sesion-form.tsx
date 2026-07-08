"use client";

import { useActionState, useState } from "react";
import { crearSesion } from "../actions";

export default function SesionForm({
  ooads,
  nombreOoadPropio,
}: {
  ooads: { id: string; nombre: string }[];
  nombreOoadPropio: string | null;
}) {
  const [state, formAction, pending] = useActionState(crearSesion, null);
  const [quorumCertificado, setQuorumCertificado] = useState(false);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-zinc-200 p-8 dark:border-zinc-800"
    >
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Nueva sesión GTAP</h1>

      {nombreOoadPropio ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">OOAD: {nombreOoadPropio}</p>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          OOAD
          <select
            name="ooad_id"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Selecciona un OOAD</option>
            {ooads.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Número de sesión
        <input
          name="numero_sesion"
          type="number"
          min={1}
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select
          name="tipo"
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="ordinaria">Ordinaria</option>
          <option value="extraordinaria">Extraordinaria</option>
          <option value="instalacion">Instalación</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Fecha
        <input
          name="fecha"
          type="date"
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Sede
        <input
          name="sede"
          type="text"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Hora de inicio
        <input
          name="hora_inicio"
          type="time"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Estatus
        <select
          name="estatus"
          defaultValue="programada"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="programada">Programada</option>
          <option value="celebrada">Celebrada</option>
          <option value="analizada">Analizada</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="quorum_certificado"
          type="checkbox"
          checked={quorumCertificado}
          onChange={(e) => setQuorumCertificado(e.target.checked)}
        />
        Quórum certificado
      </label>
      {!quorumCertificado && (
        <p className="text-sm text-amber-600">
          Advertencia: sin marcar, la sesión queda registrada como quórum no certificado. Puedes continuar de todas formas.
        </p>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Guardando..." : "Crear sesión"}
      </button>
    </form>
  );
}
