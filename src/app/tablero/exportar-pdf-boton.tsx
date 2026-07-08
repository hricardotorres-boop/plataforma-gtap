"use client";

export default function ExportarPdfBoton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
    >
      Exportar a PDF
    </button>
  );
}
