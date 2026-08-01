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

/* -------------------------------------------------------------------------- */
/*  Examen                                                                    */
/* -------------------------------------------------------------------------- */

/** Tipos de pregunta soportados. */
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

/** Nivel de dificultad pedido al generador. */
export type Difficulty = "facil" | "media" | "dificil";

/**
 * Una pregunta del examen. Esquema plano (en vez de unión discriminada) para
 * que el structured output del LLM sea robusto entre proveedores: los campos
 * que no aplican a un tipo vienen en null / [].
 */
export interface Question {
  type: QuestionType;
  /** Enunciado de la pregunta. */
  question: string;
  /** Opciones (solo opción múltiple; [] en el resto). */
  options: string[];
  /** Índice 0-based de la opción correcta (solo opción múltiple; null si no). */
  correctIndex: number | null;
  /** Respuesta correcta de verdadero/falso (null si no aplica). */
  correctBoolean: boolean | null;
  /** Respuesta modelo para desarrollo (null si no aplica). */
  modelAnswer: string | null;
  /** Puntos clave que debería mencionar una buena respuesta de desarrollo. */
  keyPoints: string[];
  /** Explicación de por qué esa es la respuesta correcta. */
  explanation: string;
  /** Cita de la fuente, ej. "apuntes.pdf, pág. 3". */
  reference: string;
}

/** Configuración enviada a POST /api/generate. */
export interface GenerateRequest {
  /** Texto fuente combinado de todos los PDFs. */
  sourceText: string;
  /** Cantidad de preguntas a generar. */
  numQuestions: number;
  /** Tipos de pregunta habilitados. */
  types: QuestionType[];
  /** Dificultad deseada. */
  difficulty: Difficulty;
}

/** Respuesta de POST /api/generate. */
export interface GenerateResponse {
  questions: Question[];
}

/** Veredicto de corrección para una respuesta de desarrollo. */
export type GradeVerdict = "correct" | "partial" | "incorrect";

/** Un ítem a corregir por IA (respuestas de desarrollo). */
export interface GradeItem {
  index: number;
  question: string;
  modelAnswer: string;
  keyPoints: string[];
  userAnswer: string;
}

/** Resultado de corrección de una respuesta de desarrollo. */
export interface GradeResult {
  index: number;
  verdict: GradeVerdict;
  feedback: string;
}

/** Respuesta de POST /api/grade. */
export interface GradeResponse {
  results: GradeResult[];
}
