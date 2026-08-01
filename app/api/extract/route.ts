import { NextResponse } from "next/server";
import { extractPdf, ScannedPdfError } from "@/lib/extract";

// pdf-parse (pdfjs) necesita APIs de Node, no funciona en el edge runtime.
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Respuesta de error estándar del endpoint: siempre { error: "mensaje" } en español. */
function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      "No se pudo leer el formulario. Enviá el PDF como multipart/form-data.",
      400
    );
  }

  const file = formData.get("file");

  // 400: no vino archivo en el campo "file".
  if (!file || !(file instanceof File)) {
    return errorResponse('Falta el archivo en el campo "file".', 400);
  }

  // 400: mimetype incorrecto.
  if (file.type !== "application/pdf") {
    return errorResponse("El archivo debe ser un PDF (application/pdf).", 400);
  }

  // 413: supera el límite de tamaño.
  if (file.size > MAX_BYTES) {
    return errorResponse("El PDF supera el límite de 10 MB.", 413);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await extractPdf(bytes, file.name);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // 422: PDF escaneado / sin texto seleccionable.
    if (error instanceof ScannedPdfError) {
      return errorResponse(error.message, 422);
    }
    // 500: cualquier otra falla de pdf-parse.
    console.error("[extract] Error al procesar el PDF:", error);
    return errorResponse("No se pudo procesar el PDF.", 500);
  }
}

/*
 * Probar el endpoint deployado con curl:
 *
 *   curl -X POST https://<tu-deploy>.vercel.app/api/extract \
 *     -F "file=@./fixtures/ejemplo.pdf;type=application/pdf"
 *
 * Local:
 *
 *   curl -X POST http://localhost:3000/api/extract \
 *     -F "file=@./fixtures/ejemplo.pdf;type=application/pdf"
 */
