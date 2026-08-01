import { PdfUploader } from "@/components/pdf-uploader";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-12 sm:py-16">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            ExamenIA
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Extracción de material
          </h1>
          <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Subí el PDF de tus apuntes y lo procesamos página por página. Ese
            texto es la base para generar exámenes con citas exactas a la
            página de origen.
          </p>
        </header>

        <PdfUploader />
      </main>

      <footer className="w-full border-t border-border py-4 text-center text-xs text-muted-foreground">
        Solo soportamos PDFs con texto seleccionable · máximo 10 MB por archivo
      </footer>
    </div>
  );
}
