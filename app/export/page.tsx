import { ExportClient } from "./export-client"
import { EXAMEN_EJEMPLO } from "@/lib/exam"

export default function ExportPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm font-medium text-primary">Paso final · Export</span>
        <h1 className="text-pretty text-2xl font-bold tracking-tight sm:text-3xl">
          Generá el PDF del examen
        </h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted">
          Elegí plantilla y versión, previsualizá el resultado y descargá el PDF listo para imprimir.
          Se usa el examen aprobado en el editor (ahora precargado con un ejemplo).
        </p>
      </header>

      <ExportClient examen={EXAMEN_EJEMPLO} />
    </main>
  )
}
