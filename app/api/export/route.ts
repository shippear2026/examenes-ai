import { renderToBuffer } from "@react-pdf/renderer"
import { ExamPDF } from "@/components/exam-pdf"
import {
  EXAMEN_EJEMPLO,
  generarVersion,
  type Examen,
  type Plantilla,
  type Version,
} from "@/lib/exam"

export const runtime = "nodejs"

interface ExportBody {
  examen?: Examen
  plantilla?: Plantilla
  version?: Version
  incluirClave?: boolean
}

const PLANTILLAS_VALIDAS: Plantilla[] = ["clasica", "moderna", "compacta"]
const VERSIONES_VALIDAS: Version[] = ["A", "B", "C"]

export async function POST(req: Request) {
  let body: ExportBody = {}
  try {
    body = await req.json()
  } catch {
    // sin body => usa el examen de ejemplo (útil para probar rápido)
  }

  const examenBase = body.examen ?? EXAMEN_EJEMPLO
  const plantilla: Plantilla = PLANTILLAS_VALIDAS.includes(body.plantilla as Plantilla)
    ? (body.plantilla as Plantilla)
    : "clasica"
  const version: Version = VERSIONES_VALIDAS.includes(body.version as Version)
    ? (body.version as Version)
    : "A"
  const incluirClave = Boolean(body.incluirClave)

  if (!examenBase?.preguntas?.length) {
    return Response.json({ error: "El examen no tiene preguntas." }, { status: 400 })
  }

  const examen = generarVersion(examenBase, version)

  const buffer = await renderToBuffer(
    ExamPDF({ examen, plantilla, version, incluirClave }),
  )

  const nombre = `examen-${plantilla}-v${version}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  })
}
