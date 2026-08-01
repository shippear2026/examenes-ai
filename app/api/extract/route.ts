import { NextResponse } from "next/server"
import { extractPdf, ExtractError } from "@/lib/extract"

// pdf-parse (pdfjs-dist) necesita APIs de Node: no funciona en edge runtime.
export const runtime = "nodejs"
export const maxDuration = 30

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  let file: File | null = null

  try {
    const formData = await request.formData()
    const field = formData.get("file")
    if (field instanceof File) {
      file = field
    }
  } catch {
    return errorJson("No se pudo leer el formulario. Enviá el PDF como multipart/form-data.", 400)
  }

  // 400: falta el archivo en el campo "file".
  if (!file) {
    return errorJson('Falta el archivo. Adjuntá un PDF en el campo "file".', 400)
  }

  // 400: mimetype incorrecto.
  if (file.type !== "application/pdf") {
    return errorJson("El archivo debe ser un PDF (application/pdf).", 400)
  }

  // 413: supera el límite de tamaño.
  if (file.size > MAX_BYTES) {
    return errorJson("El PDF supera el límite de 10 MB.", 413)
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await extractPdf(buffer, file.name)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    // 422: PDF escaneado / sin texto seleccionable (u otros errores de dominio).
    if (err instanceof ExtractError) {
      return errorJson(err.message, err.status)
    }
    // 500: pdf-parse lanzó una excepción inesperada.
    console.error("[extract] Error al procesar el PDF:", err)
    return errorJson("No se pudo procesar el PDF. Intentá con otro archivo.", 500)
  }
}

/*
 * Probar el endpoint deployado (reemplazá la URL y la ruta al PDF):
 *
 * curl -X POST https://TU-APP.vercel.app/api/extract \
 *   -F "file=@./fixtures/ejemplo.pdf;type=application/pdf"
 */
