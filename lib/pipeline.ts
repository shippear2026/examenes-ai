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

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      subject: prompt,
      questionType,
      count,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    questions?: Question[];
    error?: string;
  };

  if (!res.ok || !data.questions) {
    throw new Error(data.error ?? "No se pudieron generar las preguntas.");
  }

  return data.questions;
}
