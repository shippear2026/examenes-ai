import { NextResponse } from "next/server";
import { generateExam, NoQuestionsError } from "@/lib/generate";

// La generación con dos agentes puede tardar; usamos Node runtime y damos margen.
export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateBody {
  fullText?: unknown;
  prompt?: unknown;
  template?: unknown;
}

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const { fullText, prompt, template } = body;

  if (typeof fullText !== "string" || fullText.trim().length === 0) {
    return NextResponse.json(
      { error: "Falta el texto del PDF (fullText)." },
      { status: 400 },
    );
  }
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Falta la descripción del examen (prompt)." },
      { status: 400 },
    );
  }

  try {
    const questions = await generateExam({
      fullText,
      prompt,
      template: typeof template === "string" ? template : undefined,
    });
    return NextResponse.json({ questions });
  } catch (err) {
    if (err instanceof NoQuestionsError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.log("[v0] /api/generate error:", err);
    return NextResponse.json(
      { error: "No se pudo generar el examen. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
