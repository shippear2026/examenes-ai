import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildDocument } from "@/lib/pdfTemplates";
import type { TemplateId } from "@/lib/pdfTemplates";
import type { Question } from "@/lib/types";
import React from "react";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExportBody {
  questions: Question[];
  template: TemplateId;
  subject: string;
  tema: "A" | "B" | "C";
}

export async function POST(req: NextRequest) {
  try {
    const body: ExportBody = await req.json();
    const { questions, template, subject, tema } = body;

    if (!questions?.length) {
      return NextResponse.json({ error: "No questions provided" }, { status: 400 });
    }

    const doc = buildDocument({
      questions,
      template: template ?? "university",
      subject: subject ?? "Materia",
      tema: tema ?? "A",
    });

    const nodeBuffer = await renderToBuffer(doc);
    // Slice to a plain ArrayBuffer that satisfies BodyInit across all TS lib versions
    const arrayBuffer = nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    ) as ArrayBuffer;

    const filename = `examen-tema-${tema ?? "A"}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[export] error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
