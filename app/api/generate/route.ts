import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import type { Question, QuestionType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "google/gemini-3.5-flash";

const questionSchema = z.object({
  type: z.enum(["multiple_choice", "development", "true_false"]),
  text: z.string().describe("El enunciado de la pregunta."),
  options: z
    .array(z.string())
    .optional()
    .describe(
      "Opciones. Solo para multiple_choice (3-4) y true_false (['Verdadero','Falso']). Omitir en development."
    ),
  correctAnswer: z
    .string()
    .optional()
    .describe("La opción correcta, exactamente como aparece en options."),
  sourcePage: z
    .number()
    .nullable()
    .optional()
    .describe("Número de página aproximado del material, o null."),
});

const responseSchema = z.object({
  questions: z.array(questionSchema),
});

export async function POST(req: Request) {
  try {
    const {
      text,
      subject,
      questionType,
      count = 10,
    }: {
      text?: string;
      subject?: string;
      questionType?: QuestionType;
      count?: number;
    } = await req.json();

    if (!text || !subject) {
      return NextResponse.json(
        { error: "Faltan datos: se requiere el texto y la descripción del examen." },
        { status: 400 }
      );
    }

    const typeHint = questionType
      ? `El tipo predominante de pregunta debe ser "${questionType}".`
      : "Elegí el tipo de pregunta más apropiado para cada caso.";

    const { object } = await generateObject({
      model: MODEL,
      schema: responseSchema,
      system: `Sos un agente generador de preguntas de examen universitario.
A partir de un fragmento de bibliografía académica y la descripción del docente,
generás preguntas claras, sin ambigüedades y fieles al material.

Reglas:
- Para "multiple_choice": incluí 4 opciones y definí "correctAnswer" (texto exacto de la correcta).
- Para "true_false": options = ["Verdadero", "Falso"] y correctAnswer una de esas dos.
- Para "development": NO incluyas options ni correctAnswer.
- No inventes contenido que no esté sustentado por el material.`,
      prompt: `BIBLIOGRAFÍA:
${text}

INSTRUCCIONES DEL DOCENTE:
${subject}

Generá exactamente ${count} preguntas. ${typeHint}`,
    });

    // Asignamos ids estables server-side (el modelo no los define).
    const questions: Question[] = object.questions.map((q, i) => ({
      id: `q${i + 1}`,
      type: q.type,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      sourcePage: q.sourcePage ?? undefined,
    }));

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[v0] /api/generate error:", err);
    return NextResponse.json(
      { error: "No se pudieron generar las preguntas." },
      { status: 500 }
    );
  }
}
