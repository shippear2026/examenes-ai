import { NextResponse } from "next/server";
import { extractPdf, ScannedPdfError } from "@/lib/extract";
import type { ExtractResponse } from "@/lib/types";

// pdf-parse depende de APIs de Node (no funciona en el edge runtime).
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
      400,
    );
  }

  const file = formData.get("file");

  // 400: falta el archivo en el campo "file".
  if (!file || !(file instanceof File)) {
    return errorResponse('Falta el archivo en el campo "file".', 400);
  }

  // 400: mimetype incorrecto.
  if (file.type !== "application/pdf") {
    return errorResponse("El archivo debe ser un PDF (application/pdf).", 400);
  }

  // 413: supera el tamaño máximo.
  if (file.size > MAX_FILE_SIZE) {
    return errorResponse("El PDF supera el tamaño máximo de 10 MB.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result: ExtractResponse = await extractPdf(buffer, file.name);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // 422: el PDF parsea pero no tiene texto seleccionable suficiente.
    if (err instanceof ScannedPdfError) {
      return errorResponse(err.message, 422);
    }
    // 500: cualquier otro fallo de pdf-parse.
    console.error("[extract] Error al procesar el PDF:", err);
    return errorResponse("Ocurrió un error al procesar el PDF.", 500);
  }
}

/*
 * Ejemplo de prueba con curl (reemplazá la URL por tu deploy):
 *
 * curl -X POST https://TU-DEPLOY.vercel.app/api/extract \
 *   -F "file=@./fixtures/ejemplo.pdf;type=application/pdf"
 *
 * Local:
 * curl -X POST http://localhost:3000/api/extract \
 *   -F "file=@./fixtures/ejemplo.pdf;type=application/pdf"
 */
