import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// Extrae líneas candidatas a puntos del orden del día desde un acta subida.
// Es un apoyo para precargar texto; el usuario siempre revisa, edita y
// confirma manualmente antes de que algo se guarde como punto de sesión.
export async function extraerCandidatosOrdenDia(archivo: File): Promise<string[]> {
  const buffer = Buffer.from(await archivo.arrayBuffer());
  let texto = "";

  try {
    if (archivo.type === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const resultado = await parser.getText();
      texto = resultado.text;
      await parser.destroy();
    } else {
      const resultado = await mammoth.extractRawText({ buffer });
      texto = resultado.value;
    }
  } catch {
    return [];
  }

  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length >= 15 && linea.length <= 400)
    .slice(0, 30);
}
