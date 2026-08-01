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
