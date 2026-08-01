import { NextResponse } from "next/server";
import { regenerateQuestion } from "@/lib/generate";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface RegenerateBody {
  fullText?: unknown;
  prompt?: unknown;
  template?: unknown;
  previous?: unknown;
  existingTexts?: unknown;
}

export async function POST(request: Request) {
  let body: RegenerateBody;
  try {
    body = (await request.json()) as RegenerateBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const { fullText, prompt, template, previous, existingTexts } = body;

  if (typeof fullText !== "string" || fullText.trim().length === 0) {
    return NextResponse.json({ error: "Falta el texto del PDF." }, { status: 400 });
  }
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Falta la descripción del examen." }, { status: 400 });
  }
  if (!previous || typeof previous !== "object") {
    return NextResponse.json({ error: "Falta la pregunta a reemplazar." }, { status: 400 });
  }

  try {
    const question = await regenerateQuestion({
      fullText,
      prompt,
      template: typeof template === "string" ? template : undefined,
      previous: previous as Question,
      existingTexts: Array.isArray(existingTexts)
        ? (existingTexts.filter((t) => typeof t === "string") as string[])
        : [],
    });
    return NextResponse.json({ question });
  } catch (err) {
    console.log("[v0] /api/generate/regenerate error:", err);
    return NextResponse.json(
      { error: "No se pudo regenerar la pregunta." },
      { status: 500 },
    );
  }
}
