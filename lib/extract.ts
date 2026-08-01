import { PDFParse } from "pdf-parse";
import type { ExtractResponse, ExtractedPage } from "@/lib/types";

/**
 * Cantidad mínima de caracteres de texto para considerar que el PDF tiene texto
 * seleccionable. Por debajo de esto asumimos que es un escaneo/imagen.
 */
export const MIN_TEXT_LENGTH = 200;

/** Error semántico: el PDF parsea pero no tiene texto seleccionable útil. */
export class ScannedPdfError extends Error {
  constructor() {
    super(
      "El PDF parece ser escaneado. Por ahora solo soportamos PDFs con texto seleccionable."
    );
    this.name = "ScannedPdfError";
  }
}

/**
 * Normaliza el texto crudo de una página:
 * - remueve caracteres de control no imprimibles,
 * - colapsa espacios/tabs múltiples,
 * - limita los saltos de línea repetidos a máximo doble salto.
 * No reconstruye tablas ni columnas: texto lineal.
 */
export function cleanText(raw: string): string {
  return (
    raw
      // Caracteres de control no imprimibles (conservamos \n y \t).
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      // Normaliza fin de línea Windows/Mac a \n.
      .replace(/\r\n?/g, "\n")
      // Espacios y tabs múltiples -> un espacio.
      .replace(/[ \t]+/g, " ")
      // Espacios al inicio/fin de cada línea.
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      // Máximo doble salto de línea.
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Lógica pura de extracción: recibe los bytes del PDF y devuelve el contrato
 * `ExtractResponse`. No sabe nada de HTTP, por eso se puede testear directo
 * (ver scripts/test-extract.ts).
 *
 * @param data     Bytes del PDF.
 * @param filename Nombre original del archivo (va en la respuesta).
 * @throws {ScannedPdfError} si el texto total es menor a MIN_TEXT_LENGTH.
 */
export async function extractPdf(
  data: Uint8Array,
  filename: string
): Promise<ExtractResponse> {
  // pdf-parse v2 convierte Buffer/Uint8Array a lo que necesita pdfjs internamente.
  const parser = new PDFParse({ data });

  try {
    // pageJoiner: "" para que la librería NO agregue su propio marcador de página;
    // nosotros construimos fullText con "[PÁGINA N]" manualmente más abajo.
    const result = await parser.getText({ pageJoiner: "" });

    const pages: ExtractedPage[] = result.pages
      .slice()
      .sort((a, b) => a.num - b.num)
      .map((p) => ({ page: p.num, text: cleanText(p.text) }));

    const totalText = pages.reduce((acc, p) => acc + p.text, "");
    if (totalText.replace(/\s/g, "").length < MIN_TEXT_LENGTH) {
      throw new ScannedPdfError();
    }

    // fullText: marcador [PÁGINA N] antes del contenido de cada página.
    const fullText = pages
      .map((p) => `[PÁGINA ${p.page}]\n${p.text}`)
      .join("\n\n");

    return {
      filename,
      totalPages: pages.length,
      pages,
      fullText,
    };
  } finally {
    // Libera el worker/documento de pdfjs.
    await parser.destroy();
  }
}
