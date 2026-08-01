import { NextRequest, NextResponse } from "next/server";
// pdf-parse must be imported via require to avoid ESM issues in Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const parsed = await pdfParse(buffer);
    const text: string = parsed.text ?? "";

    if (!text.trim()) {
      return NextResponse.json({ error: "PDF appears to be empty or unreadable" }, { status: 422 });
    }

    // Trim to first 12 000 chars to stay within Gemini's context comfortably
    return NextResponse.json({ text: text.slice(0, 12000) });
  } catch (err) {
    console.error("[extract] error:", err);
    return NextResponse.json({ error: "Failed to extract PDF text" }, { status: 500 });
  }
}
