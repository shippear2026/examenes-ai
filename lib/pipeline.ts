import type { Question, QuestionType } from "@/lib/types";
import type { TemplateId } from "@/components/TemplateSelector";

/** Fases del pipeline, para que la UI muestre progreso real. */
export type PipelinePhase = "extracting" | "generating" | "supervising";

/** Resultado del pipeline: preguntas finales + texto extraído del PDF. */
export interface PipelineResult {
  questions: Question[];
  text: string;
}

/** Extrae el texto plano de un PDF llamando al endpoint /api/extract. */
export async function extractPdfText(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/extract", { method: "POST", body: form });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor para leer el PDF. Revisá tu conexión e intentá de nuevo."
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };

  if (!res.ok || !data.text) {
    throw new Error(data.error ?? "No se pudo extraer el texto del PDF.");
  }

  return data.text;
}

/** Deduce el tipo de pregunta a partir de la descripción del profe. */
function inferQuestionType(prompt: string): QuestionType {
  const p = prompt.toLowerCase();
  if (/verdadero|falso|v\/f|true.?false/.test(p)) return "true_false";
  if (/desarroll|abiert|ensayo|explic|justific|redacc/.test(p)) return "development";
  return "multiple_choice";
}

/** Deduce cuántas preguntas pidió el profe (default 10). */
function inferCount(prompt: string): number {
  const match = prompt.match(/\b(\d{1,2})\b/);
  const n = match ? parseInt(match[1], 10) : 10;
  return Math.min(Math.max(n, 1), 30);
}

/**
 * Pipeline completo: extrae el texto del PDF, genera las preguntas con el
 * agente generador y las revisa con el agente supervisor.
 *
 * `onPhase` permite que la UI muestre el progreso real (no una animación
 * ficticia). Devuelve las preguntas finales junto al texto extraído.
 */
export async function runExamPipeline(
  file: File,
  prompt: string,
  _template: TemplateId,
  onPhase?: (phase: PipelinePhase) => void
): Promise<PipelineResult> {
  // Fase 1: extracción del texto del PDF.
  onPhase?.("extracting");
  const text = await extractPdfText(file);

  const questionType = inferQuestionType(prompt);
  const count = inferCount(prompt);

  // Fase 2: agente generador.
  onPhase?.("generating");
  let genRes: Response;
  try {
    genRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, subject: prompt, questionType, count }),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el agente generador. Intentá de nuevo en unos segundos."
    );
  }

  const genData = (await genRes.json().catch(() => ({}))) as {
    questions?: Question[];
    error?: string;
  };

  if (!genRes.ok || !genData.questions || genData.questions.length === 0) {
    throw new Error(genData.error ?? "No se pudieron generar las preguntas.");
  }

  // Fase 3: agente supervisor. Revisa el borrador y agrega notas donde ajustó.
  // Si el supervisor falla, seguimos con las preguntas del generador.
  onPhase?.("supervising");
  try {
    const supRes = await fetch("/api/supervise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: genData.questions, instrucciones: prompt }),
    });

    if (supRes.ok) {
      const supData = (await supRes.json().catch(() => ({}))) as {
        questions?: Question[];
      };
      if (supData.questions && supData.questions.length > 0) {
        return { questions: supData.questions, text };
      }
    }
  } catch {
    // fallback silencioso a las preguntas del generador
  }

  return { questions: genData.questions, text };
}
