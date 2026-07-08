"use client";

import { useActionState } from "react";
import { subirDocumento } from "../documento-actions";
import RevisionPuntosForm from "./revision-puntos-form";

const ETIQUETAS_TIPO_DOCUMENTO: Record<string, string> = {
  acta: "Acta",
  anexo: "Anexo",
  reporte_analisis: "Reporte de análisis",
  ficha_tecnica: "Ficha técnica",
};

export default function DocumentoForm({
  sesionId,
  documentosVigentes,
}: {
  sesionId: string;
  documentosVigentes: { id: string; nombre_archivo: string; tipo: string }[];
}) {
  const subirConSesion = subirDocumento.bind(null, sesionId);
  const [state, formAction, pending] = useActionState(subirConSesion, null);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-col gap-2 text-sm">
        <label className="flex flex-col gap-1">
          Tipo de documento
          <select name="tipo" required className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="acta">Acta</option>
            <option value="anexo">Anexo</option>
            <option value="reporte_analisis">Reporte de análisis</option>
            <option value="ficha_tecnica">Ficha técnica</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Archivo (PDF o DOCX, máx. 20 MB)
          <input name="archivo" type="file" accept=".pdf,.docx" required className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>

        {documentosVigentes.length > 0 && (
          <label className="flex flex-col gap-1">
            Sustituye a (opcional)
            <select name="sustituye_a" className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
              <option value="">Documento nuevo</option>
              {documentosVigentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre_archivo} ({ETIQUETAS_TIPO_DOCUMENTO[d.tipo] ?? d.tipo})
                </option>
              ))}
            </select>
          </label>
        )}

        {state?.error && <p className="text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-green-600">Documento subido</p>}

        <button type="submit" disabled={pending} className="self-start rounded bg-black px-3 py-1 text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {pending ? "Subiendo..." : "Subir documento"}
        </button>
      </form>

      {state?.candidatos && <RevisionPuntosForm sesionId={sesionId} candidatos={state.candidatos} />}
    </div>
  );
}
