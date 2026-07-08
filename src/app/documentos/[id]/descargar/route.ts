import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

function bucketDeTipo(tipo: string) {
  if (tipo === "acta" || tipo === "anexo") return "actas";
  if (tipo === "reporte_analisis") return "reportes";
  return "fichas";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: documento } = await supabase
    .from("documentos")
    .select("tipo, ruta_storage")
    .eq("id", id)
    .single();

  if (!documento) {
    return new NextResponse("Documento no encontrado o sin acceso", { status: 404 });
  }

  const bucket = bucketDeTipo(documento.tipo);
  const { data: firmada, error } = await supabase.storage.from(bucket).createSignedUrl(documento.ruta_storage, 60);

  if (error || !firmada) {
    return new NextResponse("No se pudo generar el enlace de descarga", { status: 500 });
  }

  redirect(firmada.signedUrl);
}
