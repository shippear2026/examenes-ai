"use client";

import { useRef, useState } from "react";
import type { ExtractResponse } from "@/lib/types";

type ItemStatus = "loading" | "success" | "error";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, igual que el endpoint

/** Estado de un archivo individual dentro de la cola de subida. */
interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: ItemStatus;
  error: string | null;
  result: ExtractResponse | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `${Date.now()}-${idCounter}`;
}

export function PdfUploader() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  async function processFile(item: UploadItem, file: File) {
    // Validaciones de cliente antes de llamar al endpoint.
    if (file.type !== "application/pdf") {
      updateItem(item.id, {
        status: "error",
        error: "El archivo debe ser un PDF.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      updateItem(item.id, {
        status: "error",
        error: "El PDF supera el límite de 10 MB.",
      });
      return;
    }

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/extract", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        updateItem(item.id, {
          status: "error",
          error: data?.error ?? "No se pudo procesar el PDF.",
        });
        return;
      }
      updateItem(item.id, {
        status: "success",
        result: data as ExtractResponse,
      });
    } catch {
      updateItem(item.id, {
        status: "error",
        error: "No se pudo conectar con el servidor. Intentá de nuevo.",
      });
    }
  }

  function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newItems: UploadItem[] = files.map((file) => ({
      id: nextId(),
      name: file.name,
      size: file.size,
      status: "loading",
      error: null,
      result: null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Procesamos todos los archivos en paralelo.
    newItems.forEach((item, i) => {
      void processFile(item, files[i]);
    });
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    // Permite volver a elegir el mismo archivo.
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function clearAll() {
    setItems([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const anyLoading = items.some((it) => it.status === "loading");

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
          dragging ? "border-primary bg-primary/5" : "border-border bg-card"
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
            Arrastrá tus PDFs acá o
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            elegí archivos
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uno o varios PDF con texto seleccionable · máx. 10 MB c/u
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={onInputChange}
          className="sr-only"
          aria-label="Subir PDFs de apuntes"
        />
      </div>

      {/* Barra de acciones */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {items.length} archivo{items.length === 1 ? "" : "s"}
            {anyLoading ? " · procesando…" : ""}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Lista de archivos */}
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <FileCard
            key={item.id}
            item={item}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FileCard({
  item,
  onRemove,
}: {
  item: UploadItem;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      {/* Cabecera del archivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
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
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-card-foreground">
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(item.size)}
              {item.status === "success" && item.result
                ? ` · ${item.result.totalPages} página${
                    item.result.totalPages === 1 ? "" : "s"
                  }`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {item.status === "loading" && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary"
                aria-hidden="true"
              />
              Extrayendo…
            </span>
          )}
          {item.status === "success" && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Listo
            </span>
          )}
          {item.status === "error" && (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              Error
            </span>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar ${item.name}`}
            className="rounded-[var(--radius)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {item.status === "error" && item.error && (
        <div
          role="alert"
          className="px-4 py-3 text-sm text-destructive"
        >
          {item.error}
        </div>
      )}

      {/* Páginas extraídas */}
      {item.status === "success" && item.result && (
        <PagesList pages={item.result.pages} />
      )}
    </div>
  );
}

function PagesList({
  pages,
}: {
  pages: ExtractResponse["pages"];
}) {
  const [openPage, setOpenPage] = useState<number | null>(
    pages[0]?.page ?? null
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      {pages.map((p) => {
        const open = openPage === p.page;
        return (
          <div
            key={p.page}
            className="overflow-hidden rounded-[var(--radius)] border border-border bg-background"
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
  );
}
