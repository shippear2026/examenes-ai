import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { text, prompt } = await req.json();

    if (!text || !prompt) {
      return NextResponse.json({ error: "Missing text or prompt" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Eres un agente generador de preguntas de examen universitario.
Recibís un fragmento de texto académico y una descripción de qué tipo de examen armar.
Devolvés ÚNICAMENTE un JSON válido con un array de preguntas. Sin texto extra antes o después.

Formato de cada pregunta:
{
  "id": "string único tipo q1, q2...",
  "type": "multiple_choice" | "development" | "true_false",
  "text": "texto de la pregunta",
  "options": ["opción A", "opción B", "opción C", "opción D"],  // solo para multiple_choice y true_false
  "correctAnswer": "la opción correcta exacta como aparece en options",
  "sourcePage": null  // dejar null siempre
}

Para true_false: options debe ser ["Verdadero", "Falso"].
Para development: omitir options y correctAnswer.
Generá exactamente las preguntas que pide el docente. Si no especifica cantidad, generá 5.`;

    const userMessage = `TEXTO DE LA BIBLIOGRAFÍA:
${text}

INSTRUCCIONES DEL DOCENTE:
${prompt}

Devolvé el JSON con el array de preguntas.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const raw = result.response.text();
    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const questions = JSON.parse(jsonStr);

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[generate] error:", err);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
