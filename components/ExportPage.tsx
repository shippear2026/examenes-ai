"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ExamPreview, { type TemplateStyle } from "./ExamPreview";
import { examByTema, examMeta, type ExamTema } from "@/lib/mockExam";

const TEMAS: ExamTema[] = ["A", "B", "C"];

const TEMPLATES: { id: TemplateStyle; label: string }[] = [
  { id: "university", label: "Universitaria" },
  { id: "secondary", label: "Secundaria" },
  { id: "minimal", label: "Minimalista" },
];

export default function ExportPage() {
  const router = useRouter();
  const [activeTema, setActiveTema] = useState<ExamTema>("A");
  const [template, setTemplate] = useState<TemplateStyle>("university");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(() => {
    setDownloading(true);
    // Simulate PDF generation delay — will be replaced with real PDF lib
    setTimeout(() => {
      setDownloading(false);
    }, 1800);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
        style={{
          backgroundColor: "rgba(9,9,15,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Brand + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 group"
            aria-label="Ir al inicio"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--accent)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
              Copiloto de Exámenes
            </span>
          </button>

          {/* Stepper */}
          <nav aria-label="Pasos" className="hidden sm:flex items-center gap-1 ml-3">
            {[
              { label: "Bibliografía", done: true, href: "/" },
              { label: "Editor", done: true, href: "/editor" },
              { label: "Exportar", active: true },
            ].map((step, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
                {step.href ? (
                  <button
                    onClick={() => router.push(step.href!)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:bg-surface"
                    style={{ color: step.done ? "var(--success)" : "var(--muted)" }}
                  >
                    {step.done && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                    {step.label}
                  </button>
                ) : (
                  <span
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{
                      background: "var(--accent-glow)",
                      color: "var(--accent-bright)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    {step.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            background: downloading
              ? "var(--surface-raised)"
              : "linear-gradient(135deg, var(--accent) 0%, var(--accent-bright) 100%)",
            color: "white",
            boxShadow: downloading ? "none" : "0 0 16px var(--accent-glow)",
          }}
        >
          {downloading ? (
            <>
              <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Generando PDF...
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </>
          )}
        </button>
      </header>

      {/* Controls bar */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {/* Tema tabs */}
        <div className="flex items-center gap-1" role="tablist" aria-label="Versión del examen">
          <span className="text-xs font-medium mr-2" style={{ color: "var(--muted)" }}>
            Versión:
          </span>
          {TEMAS.map((tema) => {
            const active = activeTema === tema;
            return (
              <button
                key={tema}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTema(tema)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={
                  active
                    ? {
                        background: "var(--accent)",
                        color: "white",
                        boxShadow: "0 0 12px var(--accent-glow)",
                      }
                    : {
                        background: "var(--surface-raised)",
                        color: "var(--muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                Tema {tema}
              </button>
            );
          })}
        </div>

        {/* Template selector */}
        <div className="flex items-center gap-1" role="group" aria-label="Plantilla de diseño">
          <span className="text-xs font-medium mr-2" style={{ color: "var(--muted)" }}>
            Plantilla:
          </span>
          {TEMPLATES.map((tpl) => {
            const active = template === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setTemplate(tpl.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={
                  active
                    ? {
                        background: "var(--accent-glow)",
                        color: "var(--accent-bright)",
                        border: "1px solid var(--accent-border)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {tpl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview area */}
      <main
        className="flex-1 overflow-y-auto py-8 px-4"
        style={{ background: "var(--surface)" }}
      >
        {/* Sheet shadow wrapper */}
        <div className="w-full max-w-[800px] mx-auto rounded-xl overflow-hidden shadow-2xl">
          <ExamPreview
            tema={activeTema}
            questions={examByTema[activeTema]}
            meta={examMeta}
            template={template}
          />
        </div>

        {/* All-temas hint */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          El PDF descargado incluye las 3 versiones (Tema A, B y C) en páginas separadas.
        </p>
      </main>
    </div>
  );
}
