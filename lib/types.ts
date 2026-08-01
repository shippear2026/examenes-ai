/**
 * Tipos compartidos del proyecto ExamenIA.
 * El resto del equipo importa desde este archivo, así que solo agregá tipos,
 * no rompas los que ya existen.
 */

/** Texto de una página individual del PDF. */
export interface ExtractedPage {
  /** Número de página (1-indexado). */
  page: number;
  /** Texto limpio de esa página. */
  text: string;
}

/**
 * Respuesta del endpoint POST /api/extract.
 * Contrato acordado con el equipo — no modificar sin coordinar.
 */
export interface ExtractResponse {
  /** Nombre del archivo subido. */
  filename: string;
  /** Cantidad total de páginas del PDF. */
  totalPages: number;
  /** Texto por página, usado por el frontend para mostrar el fragmento fuente. */
  pages: ExtractedPage[];
  /**
   * Texto completo con el marcador `[PÁGINA N]` antes del contenido de cada
   * página. Lo consume /api/generate para que el LLM pueda citar páginas.
   */
  fullText: string;
}
