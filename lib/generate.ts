import { generateText, Output } from "ai";
import { z } from "zod";
import type { Question, QuestionType } from "@/lib/types";

/**
 * Modelo usado para ambos agentes. Se accede vía Vercel AI Gateway
 * (autenticado con la env var AI_GATEWAY_API_KEY). No se instancia ningún
 * provider: el AI SDK resuelve el string "proveedor/modelo" contra el gateway.
 */
const MODEL = "google/gemini-3.6-flash";

/** Límite de caracteres del texto fuente para acotar tokens/costo/latencia. */
const MAX_SOURCE_CHARS = 60_000;

export interface GenerateExamInput {
  /** Texto completo del PDF (con marcadores [PÁGINA N]) desde /api/extract. */
  fullText: string;
  /** Instrucciones del docente: qué evaluar, cantidad, dificultad, etc. */
  prompt: string;
  /** Plantilla de diseño elegida (afecta tono/formato, no el diseño visual). */
  template?: string;
}

/** Error de dominio: el modelo no devolvió preguntas utilizables. */
export class NoQuestionsError extends Error {
  constructor(message = "El modelo no pudo generar preguntas a partir del material.") {
    super(message);
    this.name = "NoQuestionsError";
  }
}

/** Esquema de una pregunta tal como la produce el LLM (sin id). */
const questionSchema = z.object({
  type: z
    .enum(["multiple_choice", "development", "true_false"])
    .describe("Tipo de pregunta"),
  text: z.string().describe("Enunciado de la pregunta, claro y autocontenido"),
  options: z
    .array(z.string())
    .nullable()
    .describe(
      "Opciones para multiple_choice (3-5). Para true_false usar ['Verdadero','Falso']. Para development: null.",
    ),
  correctAnswer: z
    .string()
    .nullable()
    .describe(
      "Respuesta correcta. Para multiple_choice/true_false debe coincidir con una opción. Para development: pauta breve de corrección.",
    ),
  sourcePage: z
    .number()
    .int()
    .nullable()
    .describe("Número de página del PDF de donde surge la pregunta, si se conoce."),
});

const examSchema = z.object({
  questions: z.array(questionSchema),
});

/** Igual que questionSchema pero permitiendo la nota del supervisor. */
const reviewedQuestionSchema = questionSchema.extend({
  supervisorNote: z
    .string()
    .nullable()
    .describe(
      "Nota breve del supervisor SÓLO si ajustó esta pregunta (qué cambió y por qué). Si no la tocó: null.",
    ),
});

const reviewSchema = z.object({
  questions: z.array(reviewedQuestionSchema),
});

type DraftQuestion = z.infer<typeof questionSchema>;
type ReviewedQuestion = z.infer<typeof reviewedQuestionSchema>;

function clampSource(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_SOURCE_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_SOURCE_CHARS)}\n\n[...material truncado por longitud...]`;
}

function templateGuidance(template?: string): string {
  switch (template) {
    case "highschool":
      return "Nivel secundario: lenguaje claro y accesible, sin tecnicismos innecesarios.";
    case "professional":
      return "Contexto profesional/certificación: enfoque aplicado y situaciones de la práctica real.";
    case "university":
    default:
      return "Nivel universitario: rigor académico, precisión conceptual y terminología correcta.";
  }
}

/**
 * AGENTE GENERADOR — crea el borrador del examen a partir del material.
 */
async function runGenerator(input: GenerateExamInput): Promise<DraftQuestion[]> {
  const source = clampSource(input.fullText);

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: examSchema }),
    system: [
      "Sos un docente experto que redacta exámenes a partir de material de estudio.",
      "Reglas estrictas:",
      "- Basá TODAS las preguntas únicamente en el material provisto. No inventes contenido externo.",
      "- Respetá al pie de la letra las instrucciones del docente (cantidad, tipos y dificultad).",
      "- Para multiple_choice: 3 a 5 opciones plausibles, una sola correcta, sin 'todas las anteriores'.",
      "- Para true_false: opciones exactamente ['Verdadero','Falso'] y correctAnswer una de ellas.",
      "- Para development: options=null y correctAnswer con una pauta breve de corrección.",
      "- Cuando puedas, indicá sourcePage según los marcadores [PÁGINA N] del material.",
      "- Redactá en español neutro. Enunciados autocontenidos, sin ambigüedades.",
      templateGuidance(input.template),
    ].join("\n"),
    prompt: [
      "INSTRUCCIONES DEL DOCENTE:",
      input.prompt.trim(),
      "",
      "MATERIAL DE ESTUDIO:",
      source,
    ].join("\n"),
  });

  return output.questions ?? [];
}

/**
 * AGENTE SUPERVISOR — revisa el borrador: corrige, mejora y anota cambios.
 */
async function runSupervisor(
  draft: DraftQuestion[],
  input: GenerateExamInput,
): Promise<ReviewedQuestion[]> {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: reviewSchema }),
    system: [
      "Sos un supervisor pedagógico que audita un examen ya redactado por otro agente.",
      "Tu tarea:",
      "- Verificá que cada pregunta sea correcta, clara y coherente con el material.",
      "- Comprobá que se cumplan las instrucciones del docente (cantidad, tipos, dificultad).",
      "- Corregí respuestas erróneas, opciones ambiguas o enunciados confusos.",
      "- Eliminá duplicados o preguntas triviales; mantené el conjunto sólido.",
      "- Cada vez que MODIFIQUES una pregunta, completá supervisorNote explicando el cambio. Si no la tocaste, supervisorNote=null.",
      "- Conservá el mismo formato de opciones/respuestas que el generador.",
    ].join("\n"),
    prompt: [
      "INSTRUCCIONES ORIGINALES DEL DOCENTE:",
      input.prompt.trim(),
      "",
      "BORRADOR A REVISAR (JSON):",
      JSON.stringify(draft, null, 2),
    ].join("\n"),
  });

  return output.questions ?? [];
}

/** Normaliza una pregunta del LLM al tipo Question del dominio (con id). */
function toDomainQuestion(q: ReviewedQuestion | DraftQuestion): Question {
  const type = q.type as QuestionType;
  const options = q.options ?? undefined;
  const supervisorNote =
    "supervisorNote" in q && q.supervisorNote ? q.supervisorNote : undefined;

  return {
    id: crypto.randomUUID(),
    type,
    text: q.text.trim(),
    options: options && options.length > 0 ? options : undefined,
    correctAnswer: q.correctAnswer ?? undefined,
    sourcePage: q.sourcePage ?? undefined,
    supervisorNote,
  };
}

/**
 * Pipeline completo de dos agentes: generador -> supervisor.
 * Devuelve las preguntas finales listas para el editor.
 */
export async function generateExam(input: GenerateExamInput): Promise<Question[]> {
  if (!input.fullText?.trim()) {
    throw new NoQuestionsError("No hay texto del PDF para generar el examen.");
  }

  const draft = await runGenerator(input);
  if (draft.length === 0) {
    throw new NoQuestionsError();
  }

  let reviewed: ReviewedQuestion[] = [];
  try {
    reviewed = await runSupervisor(draft, input);
  } catch {
    // Si el supervisor falla, no perdemos el trabajo del generador.
    reviewed = [];
  }

  const finalList = reviewed.length > 0 ? reviewed : draft;
  return finalList.map(toDomainQuestion);
}

/**
 * Regenera UNA sola pregunta, evitando duplicar las existentes.
 * Usado por el botón "regenerar" del editor.
 */
export async function regenerateQuestion(params: {
  fullText: string;
  prompt: string;
  template?: string;
  previous: Question;
  existingTexts: string[];
}): Promise<Question> {
  const source = clampSource(params.fullText);

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: questionSchema }),
    system: [
      "Sos un docente experto. Generá UNA sola pregunta nueva para reemplazar otra.",
      "- Basate únicamente en el material provisto.",
      "- Mantené el mismo tipo de pregunta que la que se reemplaza.",
      "- NO repitas ninguna de las preguntas existentes.",
      "- Respetá el formato de opciones/respuesta según el tipo.",
    ].join("\n"),
    prompt: [
      "INSTRUCCIONES DEL DOCENTE:",
      params.prompt.trim(),
      "",
      `TIPO REQUERIDO: ${params.previous.type}`,
      "",
      "PREGUNTA A REEMPLAZAR:",
      params.previous.text,
      "",
      "PREGUNTAS EXISTENTES (no repetir):",
      params.existingTexts.map((t, i) => `${i + 1}. ${t}`).join("\n"),
      "",
      "MATERIAL DE ESTUDIO:",
      source,
    ].join("\n"),
  });

  return toDomainQuestion(output);
}
