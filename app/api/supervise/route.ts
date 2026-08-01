import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing questions array" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Eres un agente supervisor pedagógico de exámenes universitarios.
Recibís un JSON con un array de preguntas generadas por otro agente.
Tu trabajo:
1. Revisar claridad, dificultad balanceada, y que las respuestas correctas sean correctas.
2. Ajustar el texto de las preguntas que lo necesiten (sin cambiar su tipo ni id).
3. Para CADA pregunta que modifiques, agregar un campo "supervisorNote" con una frase corta en español explicando qué ajustaste (ej: "Ajustada: opción correcta ambigua aclarada").
4. Devolver ÚNICAMENTE un JSON válido con:
{
  "questions": [...array de preguntas igual al input pero con ajustes y supervisorNote donde corresponda...],
  "changes": ["descripción del cambio 1", "descripción del cambio 2", ...]
}

Reglas:
- No cambies ids ni types.
- supervisorNote solo en preguntas que realmente modificaste.
- Si una pregunta está bien, dejala igual (sin supervisorNote).
- changes es un array de strings, máximo 5 entradas, describiendo los cambios más relevantes.
- Sin texto extra fuera del JSON.`;

    const userMessage = `Preguntas a revisar:
${JSON.stringify(questions, null, 2)}

Devolvé el JSON con las preguntas revisadas y el array de cambios.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const raw = result.response.text();
    const jsonStr = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      questions: parsed.questions ?? questions,
      changes: parsed.changes ?? [],
    });
  } catch (err) {
    console.error("[supervise] error:", err);
    return NextResponse.json({ error: "Failed to supervise questions" }, { status: 500 });
  }
}
