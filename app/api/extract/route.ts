import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  let file: File | null = null;

  try {
    const form = await req.formData();
    const value = form.get("file");
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la petición debe ser multipart/form-data con un campo 'file'." },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json(
      { error: "No se recibió ningún archivo en el campo 'file'." },
      { status: 400 }
    );
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "El archivo debe ser un PDF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "El PDF supera el límite de 50 MB." },
      { status: 413 }
    );
  }

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);

    // mergePages: false -> devuelve un array con el texto de cada página,
    // así podemos anteponer marcas [[page:N]] que el generador usa para citar.
    const { totalPages, text } = await extractText(pdf, { mergePages: false });

    const pages = Array.isArray(text) ? text : [text];

    const plainText = pages
      .map((pageText, i) => {
        const clean = normalize(pageText ?? "");
        return clean ? `[[page:${i + 1}]]\n${clean}` : "";
      })
      .filter(Boolean)
      .join("\n\n");

    const trimmed = plainText.trim();

    if (!trimmed) {
      return NextResponse.json(
        {
          error:
            "No se pudo extraer texto del PDF. Puede ser un documento escaneado (imágenes) sin capa de texto.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: trimmed,
      totalPages,
      characters: trimmed.length,
    });
  } catch (err) {
    console.error("[v0] Error extrayendo texto del PDF:", err);
    return NextResponse.json(
      { error: "No se pudo leer el PDF. Verificá que el archivo no esté dañado ni protegido con contraseña." },
      { status: 500 }
    );
  }
}

/** Colapsa espacios/saltos de línea redundantes manteniendo párrafos legibles. */
function normalize(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
