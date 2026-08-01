import { PDFParse } from "pdf-parse"
import type { ExtractResponse, PageText } from "@/lib/types"

/** Longitud mínima de texto para considerar el PDF como "con texto seleccionable". */
export const MIN_TEXT_LENGTH = 200

/**
 * Error de dominio de la extracción. Lleva un `status` HTTP para que la capa
 * HTTP (route.ts) lo mapee directamente, y también es útil en el script de test.
 */
export class ExtractError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ExtractError"
    this.status = status
  }
}

/**
 * Limpieza de texto (lineal, sin reconstruir tablas ni columnas):
 * - Remueve caracteres de control no imprimibles (preserva \n y \t).
 * - Normaliza saltos de línea (\r\n, \r -> \n).
 * - Colapsa espacios/tabs múltiples en uno solo.
 * - Colapsa 3+ saltos de línea en un máximo de doble salto.
 */
export function cleanText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Lógica pura de extracción (sin HTTP): recibe el contenido del PDF como Buffer
 * y devuelve el contrato `ExtractResponse`.
 *
 * Usa pdf-parse v2 (clase `PDFParse` sobre pdfjs-dist), que devuelve el texto
 * página por página de forma nativa —no hace falta el hack de `pagerender` de la v1—.
 *
 * @throws {ExtractError} 422 si el PDF parsea pero tiene muy poco texto (escaneado/imagen).
 */
export async function extractPdf(buffer: Buffer, filename: string): Promise<ExtractResponse> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })

  try {
    // `pageJoiner: ""` desactiva el marcador por defecto ("-- page of total --")
    // para quedarnos con el texto crudo de cada página y armar nosotros los marcadores.
    const result = await parser.getText({ pageJoiner: "" })

    const pages: PageText[] = result.pages
      .map((p) => ({ page: p.num, text: cleanText(p.text) }))
      .sort((a, b) => a.page - b.page)

    const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0)
    if (totalChars < MIN_TEXT_LENGTH) {
      throw new ExtractError(
        "El PDF parece ser escaneado. Por ahora solo soportamos PDFs con texto seleccionable.",
        422,
      )
    }

    const fullText = pages.map((p) => `[PÁGINA ${p.page}]\n${p.text}`).join("\n\n")

    return {
      filename,
      totalPages: result.total,
      pages,
      fullText,
    }
  } finally {
    await parser.destroy()
  }
}
