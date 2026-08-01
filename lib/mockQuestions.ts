import type { Question } from "./types";

export const mockQuestions: Question[] = [
  {
    id: "q1",
    type: "multiple_choice",
    text: "¿Cuál de los siguientes enunciados describe correctamente el principio de responsabilidad única (SRP) en programación orientada a objetos?",
    options: [
      "Una clase debe tener una sola responsabilidad y, por lo tanto, un único motivo para cambiar.",
      "Una función puede llamar a otras funciones siempre que retorne un único valor.",
      "Cada módulo debe exponer una única interfaz pública.",
      "Un programa solo debe resolver un problema a la vez.",
    ],
    correctAnswer: "Una clase debe tener una sola responsabilidad y, por lo tanto, un único motivo para cambiar.",
    sourcePage: 47,
    supervisorNote: "Ajustada: dificultad pareja con pregunta 3",
  },
  {
    id: "q2",
    type: "true_false",
    text: "El patrón de diseño Observer permite que un objeto notifique automáticamente a múltiples objetos dependientes cuando su estado cambia.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
    sourcePage: 83,
  },
  {
    id: "q3",
    type: "multiple_choice",
    text: "En el contexto de los algoritmos de ordenamiento, ¿cuál tiene la menor complejidad temporal en el caso promedio?",
    options: [
      "Bubble Sort — O(n²)",
      "Merge Sort — O(n log n)",
      "Insertion Sort — O(n²)",
      "Selection Sort — O(n²)",
    ],
    correctAnswer: "Merge Sort — O(n log n)",
    sourcePage: 112,
    supervisorNote: "Reformulada: la opción original era ambigua respecto al caso promedio vs. peor caso",
  },
  {
    id: "q4",
    type: "development",
    text: "Explicá con tus propias palabras la diferencia entre herencia y composición en la programación orientada a objetos. Incluí un ejemplo concreto de cuándo es preferible usar composición sobre herencia.",
    sourcePage: 61,
  },
  {
    id: "q5",
    type: "true_false",
    text: "Una función pura siempre produce el mismo output dado el mismo input y no genera efectos secundarios observables.",
    options: ["Verdadero", "Falso"],
    correctAnswer: "Verdadero",
  },
];
