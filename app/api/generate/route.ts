import { NextResponse } from "next/server";
import type { Question, QuestionType } from "@/lib/types";

export const maxDuration = 60;

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["multiple_choice", "development", "true_false"],
          },
          text: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Solo si type es multiple_choice. 4 opciones.",
          },
          correctAnswer: { type: "string" },
          sourcePage: {
            type: "number",
            description:
              "Número de página del PDF de donde sale la pregunta, si el texto trae marcas de página (ej. [[page:3]]). Omitir si no hay marcas.",
          },
        },
        required: ["type", "text", "correctAnswer"],
      },
    },
  },
  required: ["questions"],
};

function buildPrompt(text: string, subject: string | undefined, questionType: QuestionType, count: number) {
  return `Sos un generador de exámenes${subject ? ` de ${subject}` : ""}. A partir del siguiente material de estudio, generá exactamente ${count} preguntas de tipo "${questionType}".

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
    const geminiRes = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text, subject, questionType, count) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: QUESTIONS_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Error de Gemini API:", geminiRes.status, errBody);
      return NextResponse.json(
        { error: `Gemini API devolvió ${geminiRes.status}. Revisá GEMINI_API_KEY y los logs del server.` },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      console.error("Respuesta inesperada de Gemini:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Gemini no devolvió contenido" },
        { status: 502 }
      );
    }

    let parsed: { questions: Omit<Question, "id">[] };
    try {
      parsed = JSON.parse(raw) as { questions: Omit<Question, "id">[] };
    } catch (parseErr) {
      console.error("No se pudo parsear el JSON de Gemini:", raw, parseErr);
      return NextResponse.json(
        { error: "Gemini no devolvió un JSON válido de preguntas" },
        { status: 502 }
      );
    }

    const withIds: Question[] = parsed.questions.map((q, i) => ({
      id: `q${i + 1}`,
      ...q,
    }));

    return NextResponse.json({ questions: withIds });
  } catch (err) {
    console.error("Error generando preguntas:", err);
    return NextResponse.json(
      { error: "Falló la generación con Gemini. Revisá GEMINI_API_KEY y los logs del server." },
      { status: 500 }
    );
  }
}
