import { NextResponse } from "next/server";
import type { Question } from "@/lib/types";

// Route del AGENTE SUPERVISOR (punto 3).
// Recibe el JSON del generador (array de preguntas), hace una 2da llamada a Gemini
// y devuelve { questions: Question[], cambios: string[] }.
// cambios = textos tipo "Ajustada pregunta 7" para mostrar en pantalla.

export const runtime = "nodejs";
export const maxDuration = 60;

// DEUDA: la key va por env var. Seteá GEMINI_API_KEY en Vercel / .env.local
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type SuperviseRequest = {
  questions: Question[];
  // opcional: contexto extra que pidió el profe (tono, dificultad, etc.)
  instrucciones?: string;
};

type SuperviseResponse = {
  questions: Question[];
  cambios: string[];
};

const SYSTEM_PROMPT = `Sos un supervisor experto de exámenes académicos. Recibís un array JSON de preguntas generadas por otro agente y tu trabajo es CORREGIRLAS y MEJORARLAS.

Revisá y corregí:
- Errores de contenido, ambigüedades o preguntas mal formuladas.
- Que las opciones de multiple_choice sean plausibles y que haya UNA sola correcta.
- Que correctAnswer coincida EXACTAMENTE con una de las options (cuando aplique).
- Dificultad pareja y redacción clara en español rioplatense neutro.
- Coherencia de tipos: "multiple_choice", "true_false" o "development".

Reglas de salida (OBLIGATORIAS):
- Devolvé SOLO un objeto JSON válido, sin markdown ni texto extra.
- Mantené el MISMO "id" de cada pregunta. No agregues ni elimines preguntas.
- Estructura de cada pregunta: { "id", "type", "text", "options"?, "correctAnswer"?, "sourcePage"?, "supervisorNote"? }.
- En "supervisorNote" poné una nota corta SOLO en las preguntas que hayas modificado (ej: "Reformulada: la opción B era ambigua"). Si no la tocaste, no incluyas supervisorNote.
- El objeto raíz debe ser: { "questions": [...], "cambios": ["Ajustada pregunta 3: ...", "Corregida respuesta correcta en pregunta 5"] }.
- "cambios" es un array de strings legibles para mostrar en pantalla. Si no hubo cambios, devolvé un array vacío.`;

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Falta GEMINI_API_KEY en las variables de entorno." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as SuperviseRequest;
    const questions = body?.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Se espera { questions: Question[] } con al menos una pregunta." },
        { status: 400 }
      );
    }

    const userPrompt = `${
      body.instrucciones
        ? `Instrucciones adicionales del profe: ${body.instrucciones}\n\n`
        : ""
    }Preguntas generadas a supervisar:\n${JSON.stringify(questions, null, 2)}`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.log("[v0] Gemini error:", geminiRes.status, errText);
      return NextResponse.json(
        { error: `Gemini respondió ${geminiRes.status}`, detail: errText },
        { status: 502 }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText: string =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      console.log("[v0] Respuesta vacía de Gemini:", JSON.stringify(geminiJson));
      return NextResponse.json(
        { error: "Gemini devolvió una respuesta vacía." },
        { status: 502 }
      );
    }

    // A veces el modelo mete el JSON entre ```json ... ```, lo limpiamos por las dudas.
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: SuperviseResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.log("[v0] No se pudo parsear el JSON del supervisor:", cleaned);
      return NextResponse.json(
        { error: "El supervisor no devolvió JSON válido.", raw: cleaned },
        { status: 502 }
      );
    }

    // Blindaje: si el modelo perdió el formato, devolvemos algo usable.
    const safeQuestions = Array.isArray(parsed.questions)
      ? parsed.questions
      : questions;
    const safeCambios = Array.isArray(parsed.cambios) ? parsed.cambios : [];

    return NextResponse.json({
      questions: safeQuestions,
      cambios: safeCambios,
    } satisfies SuperviseResponse);
  } catch (err) {
    console.log("[v0] Error en /api/supervise:", (err as Error).message);
    return NextResponse.json(
      { error: "Error interno en el supervisor." },
      { status: 500 }
    );
  }
}
