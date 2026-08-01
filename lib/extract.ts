import { PDFParse } from "pdf-parse";
import type { ExtractResponse, ExtractedPage } from "./types";

/** Mínimo de caracteres para considerar que el PDF tiene texto seleccionable. */
export const MIN_TEXT_LENGTH = 200;

/**
 * Error tipado que indica que el PDF parseó correctamente pero no contiene
 * texto suficiente (probablemente es un PDF escaneado / imagen).
 * El route lo mapea a un 422.
 */
export class ScannedPdfError extends Error {
  constructor(
    message = "El PDF parece ser escaneado. Por ahora solo soportamos PDFs con texto seleccionable.",
  ) {
    super(message);
    this.name = "ScannedPdfError";
  }
}

/**
 * Limpia el texto de una página:
 * - Remueve caracteres de control no imprimibles (conserva \n y \t).
 * - Colapsa espacios/tabs múltiples en uno solo.
 * - Limita los saltos de línea repetidos a un máximo de doble salto.
 * No reconstruye tablas ni columnas: el resultado es texto lineal.
 */
export function cleanText(input: string): string {
  return input
    // Remover caracteres de control no imprimibles, excepto \t (\x09) y \n (\x0A).
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalizar saltos de línea de Windows/Mac a \n.
    .replace(/\r\n?/g, "\n")
    // Colapsar espacios y tabs múltiples (dentro de una línea) en un solo espacio.
    .replace(/[ \t]+/g, " ")
    // Quitar espacios al inicio/fin de cada línea.
    .replace(/ *\n */g, "\n")
    // Máximo doble salto de línea.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Lógica pura de extracción (sin HTTP): recibe el binario del PDF y su nombre,
 * devuelve el contrato `ExtractResponse`.
 *
 * Usa pdf-parse v2 (`PDFParse.getText`), que ya entrega el texto página por
 * página en `result.pages`, por lo que no hace falta el hack de `pagerender`
 * de las versiones 1.x.
 *
 * @throws {ScannedPdfError} si el texto total tiene menos de MIN_TEXT_LENGTH caracteres.
 */
export async function extractPdf(
  data: Buffer | Uint8Array,
  filename: string,
): Promise<ExtractResponse> {
  const parser = new PDFParse({ data });

  try {
    // pageJoiner vacío: no queremos el marcador por defecto de la librería,
    // construimos nuestro propio fullText con el marcador [PÁGINA N].
    const result = await parser.getText({ pageJoiner: "" });

    const pages: ExtractedPage[] = result.pages.map((p) => ({
      page: p.num,
      text: cleanText(p.text ?? ""),
    }));

    const totalTextLength = pages.reduce((sum, p) => sum + p.text.length, 0);
    if (totalTextLength < MIN_TEXT_LENGTH) {
      throw new ScannedPdfError();
    }

    // fullText con marcador [PÁGINA N] antes del contenido de cada página.
    const fullText = pages
      .map((p) => `[PÁGINA ${p.page}]\n${p.text}`)
      .join("\n\n");

    return {
      filename,
      totalPages: result.total,
      pages,
      fullText,
    };
  } finally {
    await parser.destroy();
  }
}
