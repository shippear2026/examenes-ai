/**
 * Debug local rápido de la lógica de extracción (sin HTTP).
 *
 * Lee ./fixtures/ejemplo.pdf y llama a `extractPdf` directamente, imprimiendo
 * un resumen del resultado (o el error de dominio si el PDF es escaneado).
 *
 * Uso:
 *   npx tsx scripts/test-extract.ts
 *   # o con otro archivo:
 *   npx tsx scripts/test-extract.ts ./ruta/a/otro.pdf
 */
import { readFile } from "node:fs/promises"
import path from "node:path"
import { extractPdf, ExtractError } from "@/lib/extract"

async function main() {
  const relPath = process.argv[2] ?? "./fixtures/ejemplo.pdf"
  const filePath = path.resolve(process.cwd(), relPath)

  const buffer = await readFile(filePath)
  const filename = path.basename(filePath)

  try {
    const result = await extractPdf(buffer, filename)

    console.log("[test-extract] filename:", result.filename)
    console.log("[test-extract] totalPages:", result.totalPages)
    console.log("[test-extract] pages extraídas:", result.pages.length)
    console.log("[test-extract] longitud fullText:", result.fullText.length)
    console.log("[test-extract] preview página 1:")
    console.log(result.pages[0]?.text.slice(0, 300) ?? "(sin texto)")
  } catch (err) {
    if (err instanceof ExtractError) {
      console.error(`[test-extract] ExtractError (${err.status}):`, err.message)
      process.exitCode = 1
      return
    }
    throw err
  }
}

main().catch((err) => {
  console.error("[test-extract] Error inesperado:", err)
  process.exitCode = 1
})
