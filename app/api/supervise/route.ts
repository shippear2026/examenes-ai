import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "google/gemini-3.5-flash";

const reviewedSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["multiple_choice", "development", "true_false"]),
      text: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      sourcePage: z.number().nullable().optional(),
      supervisorNote: z
        .string()
        .optional()
        .describe(
          "Nota breve SOLO si ajustaste la pregunta, ej: 'Ajustada: opción C era ambigua'. Omitir si no la tocaste."
        ),
    })
  ),
  cambios: z
    .array(z.string())
    .describe(
      "Lista legible de los ajustes realizados, ej: 'Ajustada pregunta 7: opción C era ambigua'."
    ),
});

export async function POST(req: Request) {
  try {
    const { questions, instrucciones }: { questions?: Question[]; instrucciones?: string } =
      await req.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Falta el array de preguntas a revisar." },
        { status: 400 }
      );
    }

    const { object } = await generateObject({
      model: MODEL,
      schema: reviewedSchema,
      system: `Sos un agente supervisor pedagógico de exámenes universitarios.
Recibís preguntas de un agente generador y las revisás por: claridad, ausencia de ambigüedad,
dificultad pareja, ausencia de opciones "trampa" y coherencia de la respuesta correcta.

Reglas:
- Mantené el MISMO id de cada pregunta.
- Corregí solo lo necesario; no reescribas preguntas que ya están bien.
- Cuando ajustes una pregunta, agregá un "supervisorNote" breve explicando el cambio.
- Si no tocás una pregunta, NO le pongas supervisorNote.
- Devolvé además "cambios": la lista legible de todos los ajustes.`,
      prompt: `PREGUNTAS A REVISAR (JSON):
${JSON.stringify(questions, null, 2)}
${instrucciones ? `\nINSTRUCCIONES ADICIONALES DEL DOCENTE:\n${instrucciones}` : ""}

Devolvé las preguntas revisadas (mismo shape, mismos ids) y la lista de cambios.`,
    });

    const reviewed: Question[] = object.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      sourcePage: q.sourcePage ?? undefined,
      supervisorNote: q.supervisorNote,
    }));

    return NextResponse.json({ questions: reviewed, cambios: object.cambios });
  } catch (err) {
    console.error("[v0] /api/supervise error:", err);
    return NextResponse.json(
      { error: "No se pudo supervisar las preguntas." },
      { status: 500 }
    );
  }
}
