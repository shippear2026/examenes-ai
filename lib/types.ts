export type QuestionType = "multiple_choice" | "development" | "true_false";

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  sourcePage?: number;
  supervisorNote?: string;
};

/** Texto extraído de una sola página del PDF. */
export interface ExtractedPage {
  page: number;
  text: string;
}

/**
 * Respuesta del endpoint POST /api/extract.
 * Contrato acordado con el equipo — no modificar los nombres de campos.
 */
export interface ExtractResponse {
  filename: string;
  totalPages: number;
  pages: ExtractedPage[];
  /**
   * Texto completo con el marcador `[PÁGINA N]` antes del contenido de cada
   * página. Lo consume /api/generate para que el LLM pueda citar páginas.
   */
  fullText: string;
}
