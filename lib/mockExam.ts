import type { Question } from "./types";

export type ExamTema = "A" | "B" | "C";

export type ExamMeta = {
  subject: string;
  course: string;
  date: string;
  institution: string;
  duration: string;
};

export const examMeta: ExamMeta = {
  subject: "Programación Orientada a Objetos",
  course: "3er año — Ing. en Sistemas",
  date: "12 de agosto de 2026",
  institution: "Universidad Nacional de Tecnología",
  duration: "2 horas",
};

// Each tema shuffles / swaps questions so the order is different
const temaA: Question[] = [
  {
    id: "a1",
    type: "multiple_choice",
    text: "¿Cuál de los siguientes enunciados describe correctamente el principio de responsabilidad única (SRP)?",
    options: [
      "Una clase debe tener una sola responsabilidad y un único motivo para cambiar.",
      "Una función puede llamar a otras funciones siempre que retorne un único valor.",
      "Cada módulo debe exponer una única interfaz pública.",
      "Un programa solo debe resolver un problema a la vez.",
    ],
    correctAnswer: "Una clase debe tener una sola responsabilidad y un único motivo para cambiar.",
  },
  {
    id: "a2",
    type: "true_false",
    text: "El patrón Observer permite que un objeto notifique automáticamente a múltiples dependientes cuando su estado cambia.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
  {
    id: "a3",
    type: "multiple_choice",
    text: "¿Qué algoritmo de ordenamiento tiene la menor complejidad temporal en el caso promedio?",
    options: [
      "Bubble Sort — O(n²)",
      "Merge Sort — O(n log n)",
      "Insertion Sort — O(n²)",
      "Selection Sort — O(n²)",
    ],
    correctAnswer: "Merge Sort — O(n log n)",
  },
  {
    id: "a4",
    type: "true_false",
    text: "Una función pura siempre produce el mismo output dado el mismo input y no genera efectos secundarios observables.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
  {
    id: "a5",
    type: "development",
    text: "Explicá la diferencia entre herencia y composición en POO. Incluí un ejemplo concreto de cuándo es preferible usar composición sobre herencia.",
  },
];

const temaB: Question[] = [
  {
    id: "b1",
    type: "true_false",
    text: "Una función pura siempre produce el mismo output dado el mismo input y no genera efectos secundarios observables.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
  {
    id: "b2",
    type: "multiple_choice",
    text: "¿Qué algoritmo de ordenamiento tiene la menor complejidad temporal en el caso promedio?",
    options: [
      "Insertion Sort — O(n²)",
      "Bubble Sort — O(n²)",
      "Selection Sort — O(n²)",
      "Merge Sort — O(n log n)",
    ],
    correctAnswer: "Merge Sort — O(n log n)",
  },
  {
    id: "b3",
    type: "development",
    text: "Explicá la diferencia entre herencia y composición en POO. Incluí un ejemplo concreto de cuándo es preferible usar composición sobre herencia.",
  },
  {
    id: "b4",
    type: "multiple_choice",
    text: "¿Cuál de los siguientes enunciados describe correctamente el principio de responsabilidad única (SRP)?",
    options: [
      "Cada módulo debe exponer una única interfaz pública.",
      "Un programa solo debe resolver un problema a la vez.",
      "Una clase debe tener una sola responsabilidad y un único motivo para cambiar.",
      "Una función puede llamar a otras funciones siempre que retorne un único valor.",
    ],
    correctAnswer: "Una clase debe tener una sola responsabilidad y un único motivo para cambiar.",
  },
  {
    id: "b5",
    type: "true_false",
    text: "El patrón Observer permite que un objeto notifique automáticamente a múltiples dependientes cuando su estado cambia.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
];

const temaC: Question[] = [
  {
    id: "c1",
    type: "development",
    text: "Explicá la diferencia entre herencia y composición en POO. Incluí un ejemplo concreto de cuándo es preferible usar composición sobre herencia.",
  },
  {
    id: "c2",
    type: "multiple_choice",
    text: "¿Cuál de los siguientes enunciados describe correctamente el principio de responsabilidad única (SRP)?",
    options: [
      "Un programa solo debe resolver un problema a la vez.",
      "Una clase debe tener una sola responsabilidad y un único motivo para cambiar.",
      "Una función puede llamar a otras funciones siempre que retorne un único valor.",
      "Cada módulo debe exponer una única interfaz pública.",
    ],
    correctAnswer: "Una clase debe tener una sola responsabilidad y un único motivo para cambiar.",
  },
  {
    id: "c3",
    type: "true_false",
    text: "El patrón Observer permite que un objeto notifique automáticamente a múltiples dependientes cuando su estado cambia.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
  {
    id: "c4",
    type: "multiple_choice",
    text: "¿Qué algoritmo de ordenamiento tiene la menor complejidad temporal en el caso promedio?",
    options: [
      "Selection Sort — O(n²)",
      "Merge Sort — O(n log n)",
      "Bubble Sort — O(n²)",
      "Insertion Sort — O(n²)",
    ],
    correctAnswer: "Merge Sort — O(n log n)",
  },
  {
    id: "c5",
    type: "true_false",
    text: "Una función pura siempre produce el mismo output dado el mismo input y no genera efectos secundarios observables.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
];

export const examByTema: Record<ExamTema, Question[]> = {
  A: temaA,
  B: temaB,
  C: temaC,
};
