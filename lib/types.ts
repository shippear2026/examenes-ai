/**
 * Contrato de respuesta del endpoint de extracción (`/api/extract`).
 *
 * Este contrato está acordado con el equipo: NO modificar la forma.
 * - `/api/generate` consume `fullText` (con marcadores [PÁGINA N]) para que
 *   el LLM pueda citar la página exacta de cada fragmento.
 * - El frontend consume `pages[]` para mostrar el fragmento fuente de cada pregunta.
 */

/** Texto extraído de una única página del PDF. */
export interface PageText {
  /** Número de página (1-indexado). */
  page: number
  /** Texto limpio de esa página. */
  text: string
}

/** Respuesta exitosa (200) del endpoint de extracción. */
export interface ExtractResponse {
  /** Nombre del archivo original subido por el docente. */
  filename: string
  /** Cantidad total de páginas del PDF. */
  totalPages: number
  /** Texto por página, en orden ascendente. */
  pages: PageText[]
  /**
   * Texto completo del documento con el marcador `[PÁGINA N]` antes del
   * contenido de cada página. Es la entrada para el prompt de generación.
   */
  fullText: string
}
