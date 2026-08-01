import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExamDocument } from "@/components/exam-pdf";
import { examByTema, examMeta, type ExamTema } from "@/lib/mockExam";
import type { TemplateStyle } from "@/components/ExamPreview";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  template?: TemplateStyle;
  includeKey?: boolean;
  meta?: typeof examMeta;
  temas?: Record<ExamTema, Question[]>;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    // sin body: usamos el examen de ejemplo
  }

  const template: TemplateStyle = body.template ?? "university";
  const includeKey = body.includeKey ?? false;
  const meta = body.meta ?? examMeta;
  const temas = body.temas ?? examByTema;

  const buffer = await renderToBuffer(
    ExamDocument({ temas, meta, template, includeKey })
  );

  const filename = `examen-${meta.subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
