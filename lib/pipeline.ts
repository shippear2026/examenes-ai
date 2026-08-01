import type { Question, QuestionType } from "@/lib/types";
import type { TemplateId } from "@/components/TemplateSelector";

/** Extrae el texto plano de un PDF llamando al endpoint /api/extract. */
export async function extractPdfText(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/extract", { method: "POST", body: form });
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
 * Pipeline completo: extrae el texto del PDF y genera las preguntas
 * a partir de ese texto plano.
 */
export async function runExamPipeline(
  file: File,
  prompt: string,
  _template: TemplateId
): Promise<Question[]> {
  const text = await extractPdfText(file);

  const questionType = inferQuestionType(prompt);
  const count = inferCount(prompt);

  // Agente 1: generador
  const genRes = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      subject: prompt,
      questionType,
      count,
    }),
  });

  const genData = (await genRes.json().catch(() => ({}))) as {
    questions?: Question[];
    error?: string;
  };

  if (!genRes.ok || !genData.questions) {
    throw new Error(genData.error ?? "No se pudieron generar las preguntas.");
  }

  // Agente 2: supervisor. Revisa el borrador y agrega notas donde ajustó.
  // Si el supervisor falla, seguimos con las preguntas del generador.
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
        return supData.questions;
      }
    }
  } catch {
    // fallback silencioso a las preguntas del generador
  }

  return genData.questions;
}
