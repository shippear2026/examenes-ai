export type QuestionType = "multiple_choice" | "development" | "true_false";

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // solo si type === "multiple_choice"
  correctAnswer?: string;
  sourcePage?: number; // cita a la página del PDF
  supervisorNote?: string; // "Ajustada por dificultad pareja", etc. si el supervisor la tocó
};

export type Exam = {
  subject: string;
  questions: Question[];
  template: "universitaria" | "secundaria" | "minimalista";
};
