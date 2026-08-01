"use client";

import { useRef, useState } from "react";
import type { ExtractResponse } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, igual que el endpoint

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfUploader() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setResult(null);
    setError(null);
    setFileName(file.name);

    if (file.type !== "application/pdf") {
      setStatus("error");
      setError("El archivo debe ser un PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setError("El PDF supera el límite de 10 MB.");
      return;
    }

    const body = new FormData();
    body.append("file", file);

    setStatus("loading");
    try {
      const res = await fetch("/api/extract", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "No se pudo procesar el PDF.");
        return;
      }
      setResult(data as ExtractResponse);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setResult(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-dashed p-10 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-card-foreground">
            Arrastrá tu PDF acá o
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            elegí un archivo
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Solo PDF con texto seleccionable · máx. 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onInputChange}
          className="sr-only"
          aria-label="Subir PDF de apuntes"
        />
      </div>

      {/* Estado */}
      {status === "loading" && (
        <div className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-4 text-sm text-muted-foreground">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden="true"
          />
          Extrayendo texto de {fileName}…
        </div>
      )}

      {status === "error" && error && (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {status === "success" && result && (
        <ExtractResult result={result} onReset={reset} />
      )}
    </div>
  );
}

function ExtractResult({
  result,
  onReset,
}: {
  result: ExtractResponse;
  onReset: () => void;
}) {
  const [openPage, setOpenPage] = useState<number | null>(
    result.pages[0]?.page ?? null
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-card-foreground">
            {result.filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {result.totalPages} página{result.totalPages === 1 ? "" : "s"}{" "}
            extraída{result.totalPages === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
        >
          Subir otro
        </button>
      </div>

      {/* Páginas */}
      <div className="flex flex-col gap-2">
        {result.pages.map((p) => {
          const open = openPage === p.page;
          return (
            <div
              key={p.page}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenPage(open ? null : p.page)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Página {p.page}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.text.length} caracteres
                  </span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open && (
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-border bg-muted/40 px-4 py-3 font-mono text-xs leading-relaxed text-card-foreground">
                  {p.text || "(sin texto en esta página)"}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
