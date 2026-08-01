/**
 * Script de debug local rápido para el endpoint de extracción.
 *
 * Llama a la lógica de parsing (extractPdf) DIRECTAMENTE, sin levantar el
 * servidor ni hacer un request HTTP. Útil para iterar sobre la limpieza del
 * texto y el formato del fullText.
 *
 * Uso (recomendado, resuelve los imports de TS):
 *   npx tsx scripts/test-extract.ts
 *
 * Requiere un PDF en ./fixtures/ejemplo.pdf
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractPdf, ScannedPdfError } from "../lib/extract";

const FIXTURE = path.resolve(process.cwd(), "fixtures", "ejemplo.pdf");

async function main() {
  let buffer: Buffer;
  try {
    buffer = await readFile(FIXTURE);
  } catch {
    console.error(`No se encontró el fixture en ${FIXTURE}`);
    console.error("Colocá un PDF de prueba en ./fixtures/ejemplo.pdf");
    process.exit(1);
  }

  try {
    const result = await extractPdf(buffer, "ejemplo.pdf");

    console.log("filename:  ", result.filename);
    console.log("totalPages:", result.totalPages);
    console.log("pages:     ", result.pages.length);
    console.log("fullText chars:", result.fullText.length);
    console.log("\n--- Vista previa de las primeras 2 páginas ---");
    for (const page of result.pages.slice(0, 2)) {
      console.log(`\n[PÁGINA ${page.page}] (${page.text.length} chars)`);
      console.log(page.text.slice(0, 500));
    }
    console.log("\n--- Primeros 800 chars de fullText ---");
    console.log(result.fullText.slice(0, 800));
  } catch (err) {
    if (err instanceof ScannedPdfError) {
      console.error("PDF escaneado / sin texto seleccionable:", err.message);
      process.exit(1);
    }
    console.error("Error al extraer el PDF:", err);
    process.exit(1);
  }
}

main();
