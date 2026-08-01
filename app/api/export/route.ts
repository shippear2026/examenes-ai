import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExamDocument } from "@/components/exam-pdf";
import type { Question } from "@/lib/types";
import type { ExamMeta, ExamTema } from "@/lib/mockExam";
import type { TemplateStyle } from "@/components/ExamPreview";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExportBody = {
  template: TemplateStyle;
  includeKey?: boolean;
  meta: ExamMeta;
  temas: Record<ExamTema, Question[]>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExportBody;
    const { template, includeKey = false, meta, temas } = body;

    if (!meta || !temas) {
      return NextResponse.json(
        { error: "Faltan datos del examen (meta o temas)." },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(
      ExamDocument({ temas, meta, template, includeKey })
    );

    // Slice to a plain ArrayBuffer that satisfies BodyInit across TS lib versions
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    const filename = `examen-${meta.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[v0] /api/export error:", err);
    return NextResponse.json(
      { error: "No se pudo generar el PDF." },
      { status: 500 }
    );
  }
}
