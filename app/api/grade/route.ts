import { generateText, Output } from "ai";
import { z } from "zod";
import type { GradeItem, GradeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "anthropic/claude-sonnet-4.5";

const resultsSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().int().describe("Índice de la pregunta corregida."),
      verdict: z
        .enum(["correct", "partial", "incorrect"])
        .describe("Veredicto: correcta, parcialmente correcta o incorrecta."),
      feedback: z
        .string()
        .describe("Devolución breve (1-2 frases) explicando la corrección."),
    }),
  ),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { items } = (body ?? {}) as { items?: GradeItem[] };

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json(
      { error: "No hay respuestas para corregir." },
      { status: 400 },
    );
  }

  const prompt = [
    "Corregí las siguientes respuestas de desarrollo de un examen.",
    "Para cada ítem, compará la respuesta del estudiante con la respuesta modelo y los puntos clave.",
    'Devolvé un veredicto: "correct" si cubre lo esencial, "partial" si acierta parcialmente, "incorrect" si está mal o vacía.',
    "El feedback debe ser breve, concreto y en español.",
    "",
    JSON.stringify(
      items.map((it) => ({
        index: it.index,
        pregunta: it.question,
        respuestaModelo: it.modelAnswer,
        puntosClave: it.keyPoints,
        respuestaEstudiante: it.userAnswer,
      })),
      null,
      2,
    ),
  ].join("\n");

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: resultsSchema }),
      system:
        "Sos un profesor que corrige exámenes con criterio justo y constructivo.",
      prompt,
    });

    const response: GradeResponse = { results: output.results };
    return Response.json(response);
  } catch (err) {
    console.log("[v0] Error corrigiendo:", (err as Error)?.message);
    return Response.json(
      { error: "No se pudo corregir. Probá de nuevo." },
      { status: 500 },
    );
  }
}
