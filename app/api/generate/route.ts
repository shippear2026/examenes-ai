import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import type { Question, QuestionType } from "@/lib/types";

export const maxDuration = 60;

// Usamos el AI Gateway de Vercel (AI_GATEWAY_API_KEY ya está disponible en el proyecto).
const MODEL = "google/gemini-3.5-flash";

const questionSchema = z.object({
  type: z.enum(["multiple_choice", "development", "true_false"]),
  text: z.string().describe("El enunciado de la pregunta."),
  options: z
    .array(z.string())
    .optional()
    .describe("Solo si type es multiple_choice: exactamente 4 opciones."),
  correctAnswer: z.string().describe("La respuesta correcta."),
  sourcePage: z
    .number()
    .optional()
    .describe(
      "Número de página del PDF de donde sale la pregunta, si el texto trae marcas tipo [[page:N]]. Omitir si no hay marcas."
    ),
});

const responseSchema = z.object({
  questions: z.array(questionSchema),
});

function buildPrompt(
  text: string,
  subject: string | undefined,
  questionType: QuestionType,
  count: number
) {
  return `Sos un generador de exámenes${
    subject ? ` de ${subject}` : ""
  }. A partir del siguiente material de estudio, generá exactamente ${count} preguntas de tipo "${questionType}".

Reglas:
- Si el tipo es "multiple_choice": incluí 4 opciones en "options" y la respuesta correcta (texto exacto, igual a una de las opciones) en "correctAnswer".
- Si el tipo es "true_false": "correctAnswer" debe ser "Verdadero" o "Falso".
- Si el tipo es "development": "correctAnswer" es una respuesta modelo breve (2-4 líneas).
- Las preguntas deben basarse solo en el contenido del material, no inventar datos externos.
- Si el material tiene marcas de página tipo [[page:N]], usá ese número en "sourcePage" para la pregunta correspondiente.

Material:
"""
${text}
"""`;
}

export async function POST(req: Request) {
  const { text, subject, questionType, count } = (await req.json()) as {
    text: string;
    subject?: string;
    questionType: QuestionType;
    count: number;
  };

  if (!text || !questionType || !count) {
    return NextResponse.json(
      { error: "Faltan campos: text, questionType, count son requeridos" },
      { status: 400 }
    );
  }

  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: responseSchema,
      prompt: buildPrompt(text, subject, questionType, count),
    });

    const withIds: Question[] = object.questions.map((q, i) => ({
      id: `q${i + 1}`,
      ...q,
    }));

    return NextResponse.json({ questions: withIds });
  } catch (err) {
    console.error("Error generando preguntas:", err);
    return NextResponse.json(
      {
        error:
          "Falló la generación de preguntas. Revisá los logs del servidor.",
      },
      { status: 500 }
    );
  }
}
