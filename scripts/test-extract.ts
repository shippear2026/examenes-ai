/**
 * Debug local rápido de la lógica de extracción, sin levantar el servidor HTTP.
 * Llama directo a extractPdf() con un PDF de ./fixtures.
 *
 * Uso:
 *   npx tsx scripts/test-extract.ts
 *   npx tsx scripts/test-extract.ts ./fixtures/otro.pdf
 */
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { extractPdf, ScannedPdfError } from "../lib/extract";

async function main() {
  const path = resolve(process.argv[2] ?? "./fixtures/ejemplo.pdf");
  console.log(`[test-extract] Leyendo ${path}`);

  const buffer = await readFile(path);

  try {
    const result = await extractPdf(new Uint8Array(buffer), basename(path));
    console.log(`[test-extract] filename:   ${result.filename}`);
    console.log(`[test-extract] totalPages: ${result.totalPages}`);
    console.log(`[test-extract] fullText:   ${result.fullText.length} chars`);
    console.log("[test-extract] --- primeras 2 páginas ---");
    for (const p of result.pages.slice(0, 2)) {
      const preview = p.text.slice(0, 200).replace(/\n/g, " ");
      console.log(`  [PÁGINA ${p.page}] ${preview}${p.text.length > 200 ? "…" : ""}`);
    }
  } catch (error) {
    if (error instanceof ScannedPdfError) {
      console.error(`[test-extract] PDF escaneado: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("[test-extract] Falló:", error);
  process.exit(1);
});
