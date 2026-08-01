import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    // pipeline.ts envía el archivo bajo el campo "file"
    const file = formData.get("file") ?? formData.get("pdf");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No se recibió ningún archivo PDF." },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await (file as File).arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });

    const plain = (Array.isArray(text) ? text.join("\n") : text)?.trim() ?? "";

    if (!plain) {
      return NextResponse.json(
        { error: "El PDF parece estar vacío o no se pudo leer su texto." },
        { status: 422 }
      );
    }

    // Recortamos a 12 000 caracteres para mantenernos dentro del contexto del modelo.
    return NextResponse.json({ text: plain.slice(0, 12000) });
  } catch (err) {
    console.error("[v0] /api/extract error:", err);
    return NextResponse.json(
      { error: "No se pudo extraer el texto del PDF." },
      { status: 500 }
    );
  }
}
