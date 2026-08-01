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

export type SuperviseRequest = {
  questions: Question[];
  /** Instrucciones opcionales del profe (tono, dificultad, etc.) */
  instrucciones?: string;
};

export type SuperviseResponse = {
  /** Preguntas corregidas por el supervisor (mismo shape que las de entrada) */
  questions: Question[];
  /** Lista legible de ajustes, ej: "Ajustada pregunta 7: opción C era ambigua" */
  cambios: string[];
};
