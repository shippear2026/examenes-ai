"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ExamPreview, { type TemplateStyle } from "./ExamPreview";
import { examByTema, examMeta as defaultMeta, type ExamTema } from "@/lib/mockExam";
import type { Question } from "@/lib/types";

const TEMAS: ExamTema[] = ["A", "B", "C"];

const TEMPLATES: { id: TemplateStyle; label: string }[] = [
  { id: "university", label: "Universitaria" },
  { id: "secondary", label: "Secundaria" },
  { id: "minimal", label: "Minimalista" },
];

/** Deterministically shuffle an array given a seed string */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ExportPage() {
  const router = useRouter();
  const [activeTema, setActiveTema] = useState<ExamTema>("A");
  const [template, setTemplate] = useState<TemplateStyle>("university");
  const [downloading, setDownloading] = useState<ExamTema | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [baseQuestions, setBaseQuestions] = useState<Question[]>([]);
  const [subject, setSubject] = useState<string>("Materia");

  // Load questions + metadata from localStorage (written by the pipeline)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("copiloto_questions");
      if (stored) {
        const parsed: Question[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBaseQuestions(parsed);
        }
      }
      const storedTemplate = localStorage.getItem("copiloto_template") as TemplateStyle | null;
      if (storedTemplate) setTemplate(storedTemplate);
      const storedMeta = localStorage.getItem("copiloto_meta");
      if (storedMeta) {
        const m = JSON.parse(storedMeta);
        if (m.subject) setSubject(m.subject);
      }
    } catch {
      // ignore
    }
  }, []);

  // Build per-tema question sets: each tema is a different shuffle of the same base questions
  const questionsByTema = useMemo<Record<ExamTema, Question[]>>(() => {
    const base = baseQuestions.length > 0 ? baseQuestions : examByTema["A"];
    return {
      A: seededShuffle(base, "tema-A"),
      B: seededShuffle(base, "tema-B"),
      C: seededShuffle(base, "tema-C"),
    };
  }, [baseQuestions]);

  const meta = useMemo(() => ({
    ...defaultMeta,
    subject,
  }), [subject]);

  const handleDownload = useCallback(async (tema: ExamTema) => {
    const questions = questionsByTema[tema];
    setDownloading(tema);
    setDownloadError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, template, subject, tema }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al generar el PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `examen-tema-${tema}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDownloading(null);
    }
  }, [questionsByTema, template, subject]);

  const isDownloading = downloading !== null;

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
            className="flex items-center gap-2"
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
                {step.href ? (
                  <button
                    onClick={() => router.push(step.href!)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
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

        {/* Download active tema button */}
        <button
          onClick={() => handleDownload(activeTema)}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            background: isDownloading
              ? "var(--surface-raised)"
              : "linear-gradient(135deg, var(--accent) 0%, var(--accent-bright) 100%)",
            color: "white",
            boxShadow: isDownloading ? "none" : "0 0 16px var(--accent-glow)",
          }}
        >
          {downloading === activeTema ? (
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
              Descargar Tema {activeTema}
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
                    ? { background: "var(--accent)", color: "white", boxShadow: "0 0 12px var(--accent-glow)" }
                    : { background: "var(--surface-raised)", color: "var(--muted)", border: "1px solid var(--border)" }
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
                    ? { background: "var(--accent-glow)", color: "var(--accent-bright)", border: "1px solid var(--accent-border)" }
                    : { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }
                }
              >
                {tpl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error banner */}
      {downloadError && (
        <div
          className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
        >
          <span>{downloadError}</span>
          <button onClick={() => setDownloadError(null)} className="shrink-0 text-xs underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Preview area */}
      <main className="flex-1 overflow-y-auto py-8 px-4" style={{ background: "var(--surface)" }}>
        <div className="w-full max-w-[800px] mx-auto rounded-xl overflow-hidden shadow-2xl">
          <ExamPreview
            tema={activeTema}
            questions={questionsByTema[activeTema]}
            meta={meta}
            template={template}
          />
        </div>

        {/* Download all 3 temas */}
        <div className="max-w-[800px] mx-auto mt-6 flex flex-col sm:flex-row items-center gap-3">
          <p className="text-xs flex-1 text-center sm:text-left" style={{ color: "var(--muted)" }}>
            Descargá cada versión por separado. Cada Tema tiene las mismas preguntas en distinto orden.
          </p>
          <div className="flex items-center gap-2">
            {TEMAS.map((t) => (
              <button
                key={t}
                onClick={() => handleDownload(t)}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-bright)",
                  color: "var(--foreground)",
                }}
              >
                {downloading === t ? (
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                Tema {t}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
