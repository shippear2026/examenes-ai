import { generateText, Output } from "ai";
import { z } from "zod";
import type {
  Difficulty,
  GenerateResponse,
  QuestionType,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Modelo vía Vercel AI Gateway (Gemini de Google, zero config en v0). */
const MODEL = "google/gemini-3.6-flash";

/** Límite de caracteres del material para acotar el prompt. */
const MAX_SOURCE_CHARS = 40_000;

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 20;

const ALL_TYPES: QuestionType[] = [
  "multiple_choice",
  "true_false",
  "short_answer",
];

const DIFFICULTIES: Difficulty[] = ["facil", "media", "dificil"];

/** Esquema plano de una pregunta — robusto para structured output. */
const questionSchema = z.object({
  type: z
    .enum(["multiple_choice", "true_false", "short_answer"])
    .describe("Tipo de pregunta."),
  question: z.string().describe("Enunciado claro y autocontenido."),
  options: z
    .array(z.string())
    .describe(
      "Solo para opción múltiple: exactamente 4 opciones plausibles. [] en los otros tipos.",
    ),
  correctIndex: z
    .number()
    .int()
    .nullable()
    .describe("Índice 0-based de la opción correcta (solo opción múltiple)."),
  correctBoolean: z
    .boolean()
    .nullable()
    .describe("Respuesta correcta de verdadero/falso (null si no aplica)."),
  modelAnswer: z
    .string()
    .nullable()
    .describe("Respuesta modelo para desarrollo (null si no aplica)."),
  keyPoints: z
    .array(z.string())
    .describe("Puntos clave esperados en una respuesta de desarrollo. [] si no aplica."),
  explanation: z
    .string()
    .describe("Explicación breve de por qué la respuesta es correcta."),
  reference: z
    .string()
    .describe('Cita de la fuente, ej. "apuntes.pdf, pág. 3".'),
});

const examSchema = z.object({
  questions: z.array(questionSchema),
});

function buildPrompt(
  source: string,
  numQuestions: number,
  types: QuestionType[],
  difficulty: Difficulty,
): string {
  const typeLabels: Record<QuestionType, string> = {
    multiple_choice: "opción múltiple (4 opciones, una correcta)",
    true_false: "verdadero / falso",
    short_answer: "respuesta corta / desarrollo",
  };
  const difficultyLabels: Record<Difficulty, string> = {
    facil: "fácil (definiciones y conceptos básicos)",
    media: "media (comprensión y relaciones entre conceptos)",
    dificil: "difícil (análisis, aplicación y casos)",
  };

  return [
    `Generá un examen de ${numQuestions} pregunta(s) basado EXCLUSIVAMENTE en el material de estudio de abajo.`,
    `Tipos de pregunta permitidos: ${types.map((t) => typeLabels[t]).join("; ")}.`,
    `Distribuí las preguntas entre esos tipos de forma equilibrada.`,
    `Nivel de dificultad: ${difficultyLabels[difficulty]}.`,
    "",
    "Reglas:",
    "- No inventes información que no esté en el material.",
    "- Cada pregunta debe poder responderse con el material dado.",
    '- En "reference" citá el archivo y la página usando los marcadores [PÁGINA N] y los títulos "### nombre-archivo" del material.',
    "- Para opción múltiple: exactamente 4 opciones, con distractores plausibles, y correctIndex entre 0 y 3.",
    "- Para verdadero/falso: usá correctBoolean.",
    "- Para desarrollo: completá modelAnswer y keyPoints.",
    "- Escribí todo en español.",
    "",
    "=== MATERIAL DE ESTUDIO ===",
    source,
  ].join("\n");
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const {
    sourceText,
    numQuestions,
    types,
    difficulty,
  } = (body ?? {}) as Partial<{
    sourceText: string;
    numQuestions: number;
    types: QuestionType[];
    difficulty: Difficulty;
  }>;

  // Validaciones de entrada.
  if (typeof sourceText !== "string" || sourceText.trim().length < 20) {
    return Response.json(
      { error: "El material de estudio está vacío o es demasiado corto." },
      { status: 400 },
    );
  }

  const count =
    typeof numQuestions === "number" && Number.isFinite(numQuestions)
      ? Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(numQuestions)))
      : 5;

  const selectedTypes =
    Array.isArray(types) && types.length > 0
      ? types.filter((t): t is QuestionType => ALL_TYPES.includes(t))
      : ALL_TYPES;

  if (selectedTypes.length === 0) {
    return Response.json(
      { error: "Elegí al menos un tipo de pregunta." },
      { status: 400 },
    );
  }

  const level: Difficulty = DIFFICULTIES.includes(difficulty as Difficulty)
    ? (difficulty as Difficulty)
    : "media";

  const source = sourceText.slice(0, MAX_SOURCE_CHARS);

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: examSchema }),
      system:
        "Sos un profesor experto que diseña exámenes de estudio a partir de apuntes. " +
        "Generás preguntas precisas, sin ambigüedades y fieles al material.",
      prompt: buildPrompt(source, count, selectedTypes, level),
    });

    const response: GenerateResponse = { questions: output.questions };
    return Response.json(response);
  } catch (err) {
    const message = (err as Error)?.message ?? "";
    console.log("[v0] Error generando examen:", message);
    // Caso frecuente: el AI Gateway pide tarjeta para habilitar los créditos.
    if (/credit card|billing|payment/i.test(message)) {
      return Response.json(
        {
          error:
            "El AI Gateway necesita una tarjeta de crédito en la cuenta de Vercel para habilitar los créditos gratuitos. Agregala y volvé a intentar.",
        },
        { status: 402 },
      );
    }
    return Response.json(
      { error: "No se pudo generar el examen. Probá de nuevo." },
      { status: 500 },
    );
  }
}
