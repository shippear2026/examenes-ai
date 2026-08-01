import { NextResponse } from "next/server";
import type {
  Question,
  SuperviseRequest,
  SuperviseResponse,
} from "@/lib/types";

// Route del AGENTE SUPERVISOR (punto 3).
// Recibe el JSON del generador (array de preguntas), hace una 2da llamada a Gemini
// y devuelve { questions: Question[], cambios: string[] }.
// cambios = textos tipo "Ajustada pregunta 7" para mostrar en pantalla.

export const runtime = "nodejs";
export const maxDuration = 60;

// DEUDA: la key va por env var. Seteá GEMINI_API_KEY en Vercel / .env.local
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Fuerza a Gemini a devolver exactamente el shape que espera el frontend.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["multiple_choice", "development", "true_false"],
          },
          text: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctAnswer: { type: "string" },
          sourcePage: { type: "integer" },
          supervisorNote: { type: "string" },
        },
        required: ["id", "type", "text"],
      },
    },
    cambios: { type: "array", items: { type: "string" } },
  },
  required: ["questions", "cambios"],
} as const;

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
- En multiple_choice y true_false, "correctAnswer" DEBE ser IGUAL (carácter por carácter) a una de las "options". Si la corregís, actualizá también correctAnswer.
- En "supervisorNote" poné UNA sola oración breve SOLO en las preguntas que modificaste (ej: "Reformulada: la opción B era ambigua"). Prohibido texto de relleno, meta-comentarios o frases como "Done"/"Checked". Si no la tocaste, no incluyas supervisorNote.
- El objeto raíz debe ser: { "questions": [...], "cambios": ["Ajustada pregunta 3: ...", "Corregida respuesta correcta en pregunta 5"] }.
- "cambios" es un array de strings legibles para pantalla y DEBE incluir una entrada por CADA pregunta que hayas modificado. Si no hubo ningún cambio, devolvé un array vacío.`;

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
          responseSchema: RESPONSE_SCHEMA,
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

    // Blindaje: preservamos ids/orden originales y no perdemos preguntas
    // aunque el modelo omita alguna o invente un id.
    const safe = sanitize(parsed, questions);

    return NextResponse.json(safe satisfies SuperviseResponse);
  } catch (err) {
    console.log("[v0] Error en /api/supervise:", (err as Error).message);
    return NextResponse.json(
      { error: "Error interno en el supervisor." },
      { status: 500 }
    );
  }
}

/**
 * Blinda la respuesta del modelo: respeta ids/orden originales, toma solo campos
 * válidos y, si el modelo omitió una pregunta, deja la original intacta.
 */
function sanitize(
  parsed: SuperviseResponse,
  original: Question[]
): SuperviseResponse {
  const byId = new Map<string, Question>();
  for (const q of parsed?.questions ?? []) {
    if (q && typeof q.id === "string") byId.set(q.id, q);
  }

  // Notas derivadas por si el modelo se olvida de poblar "cambios".
  const derivadas: string[] = [];

  const questions: Question[] = original.map((orig, i) => {
    const fixed = byId.get(orig.id);
    if (!fixed) return orig; // el modelo la omitió: dejamos la original

    const options = Array.isArray(fixed.options) ? fixed.options : orig.options;
    let correctAnswer = fixed.correctAnswer ?? orig.correctAnswer;

    // Para MC / V-F la respuesta correcta debe existir entre las opciones.
    // Si el modelo la dejó incoherente, caemos a la original si esta sí matchea.
    if (
      options &&
      correctAnswer &&
      !options.includes(correctAnswer) &&
      orig.correctAnswer &&
      options.includes(orig.correctAnswer)
    ) {
      correctAnswer = orig.correctAnswer;
    }

    const note = cleanNote(fixed.supervisorNote);
    if (note) derivadas.push(`Ajustada pregunta ${i + 1}: ${note}`);

    return {
      id: orig.id,
      type: fixed.type ?? orig.type,
      text: typeof fixed.text === "string" ? fixed.text : orig.text,
      options,
      correctAnswer,
      sourcePage: orig.sourcePage,
      supervisorNote: note,
    };
  });

  const modelCambios = Array.isArray(parsed?.cambios)
    ? parsed.cambios.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  // Si el modelo devolvió "cambios" usamos esos; si no, los derivamos de las notas.
  const cambios = modelCambios.length > 0 ? modelCambios : derivadas;

  return { questions, cambios };
}

/** Recorta la nota del supervisor a UNA oración y descarta relleno del modelo. */
function cleanNote(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Nos quedamos con la primera oración y capamos el largo.
  const firstSentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  return firstSentence.slice(0, 160).trim();
}
