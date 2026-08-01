"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "./QuestionCard";
import { mockQuestions } from "@/lib/mockQuestions";
import type { Question } from "@/lib/types";

export default function EditorPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Load questions from localStorage (written by LandingPage pipeline)
  // Fall back to mock data when navigating directly for development
  useEffect(() => {
    try {
      const stored = localStorage.getItem("copiloto_questions");
      if (stored) {
        const parsed: Question[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setQuestions(mockQuestions);
  }, []);

  // Persist questions back to localStorage on every change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem("copiloto_questions", JSON.stringify(questions));
    }
  }, [questions]);

  function handleUpdate(id: string, changes: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...changes } : q))
    );
  }

  async function handleRegenerate(id: string) {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    setRegeneratingId(id);
    try {
      const text = localStorage.getItem("copiloto_text") ?? "";
      const meta = JSON.parse(localStorage.getItem("copiloto_meta") ?? "{}");
      const subject = meta.subject ?? "la materia";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          prompt: `Regenerá UNA sola pregunta de tipo "${question.type}" sobre ${subject}. Devolvé un array con una única pregunta.`,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const { questions: newQs }: { questions: Question[] } = await res.json();
      if (!newQs?.length) throw new Error("No question returned");

      const newQ: Question = { ...newQs[0], id: question.id };
      setQuestions((prev) => prev.map((q) => (q.id === id ? newQ : q)));
    } catch {
      // silently fail — question stays unchanged
    } finally {
      setRegeneratingId(null);
    }
  }

  function handleDiscard(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  const approvedCount = questions.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
        style={{
          backgroundColor: "rgba(9,9,15,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1L10.5 6H15L11.5 9.5L12.8 14.5L8 11.8L3.2 14.5L4.5 9.5L1 6H5.5L8 1Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight" style={{ color: "var(--foreground)" }}>
              Copiloto de Exámenes
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Editor de preguntas
            </span>
          </div>
        </div>

        {/* Step breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5" aria-label="Pasos">
          <StepCrumb label="Bibliografía" done />
          <ChevronRight />
          <StepCrumb label="Editor" active />
          <ChevronRight />
          <StepCrumb label="Exportar" />
        </nav>

        {/* Question counter */}
        <div
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-bright)",
            color: "var(--muted)",
          }}
        >
          <span
            className="font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {approvedCount}
          </span>
          preguntas
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 sm:pt-12 pb-40">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* Page heading */}
          <div className="flex flex-col gap-1.5">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight text-balance"
              style={{ color: "var(--foreground)" }}
            >
              Revisá y editá las preguntas
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Hacé clic en cualquier pregunta para editarla inline. Podés regenerar
              preguntas individuales o descartarlas antes de exportar.
            </p>
          </div>

          {/* Agent summary strip */}
          <div
            className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-bright)",
            }}
          >
            <div
              className="flex items-center gap-2 text-xs"
              style={{
                color: "var(--accent-bright)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--accent-bright)" }}
              />
              Agente generador: {approvedCount} preguntas creadas
            </div>
            <div
              className="w-px h-4 shrink-0"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "#fbbf24" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#fbbf24" }}
              />
              Agente supervisor: {questions.filter((q) => q.supervisorNote).length} ajustadas
            </div>
          </div>

          {/* Empty state */}
          {questions.length === 0 && (
            <div
              className="rounded-2xl flex flex-col items-center gap-4 py-16 px-8 text-center"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px dashed var(--border-bright)",
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--surface-raised)" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path
                    d="M11 4v14M4 11h14"
                    stroke="var(--muted)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  No quedan preguntas
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  Descartaste todas las preguntas. Volvé al inicio para regenerar.
                </p>
              </div>
            </div>
          )}

          {/* Question cards */}
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              onUpdate={handleUpdate}
              onRegenerate={handleRegenerate}
              onDiscard={handleDiscard}
              isRegenerating={regeneratingId === q.id}
            />
          ))}
        </div>
      </main>

      {/* Fixed bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4"
        style={{
          backgroundColor: "rgba(9,9,15,0.95)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Left: summary */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2 7l3.5 3.5L12 3"
                  stroke="var(--success)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {approvedCount}
                </span>{" "}
                {approvedCount === 1 ? "pregunta lista" : "preguntas listas"}
              </span>
            </div>
          </div>

          {/* Right: export button */}
          <button
            type="button"
            onClick={() => router.push("/export")}
            disabled={approvedCount === 0}
            className="flex items-center gap-2 rounded-xl font-semibold text-sm h-11 px-6 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            style={
              approvedCount > 0
                ? {
                    background:
                      "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
                    color: "white",
                    boxShadow: "0 4px 20px var(--accent-glow)",
                  }
                : {
                    backgroundColor: "var(--surface-raised)",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path
                d="M7.5 1.5v8M4.5 6.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 10v2.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Exportar examen
          </button>
        </div>
      </div>
    </div>
  );
}

function StepCrumb({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: active
          ? "var(--accent-glow)"
          : done
          ? "transparent"
          : "transparent",
        border: active
          ? "1px solid var(--accent-border)"
          : "1px solid transparent",
        color: active
          ? "var(--accent-bright)"
          : done
          ? "var(--foreground)"
          : "var(--muted)",
        textDecoration: done ? "none" : "none",
        opacity: done ? 0.7 : 1,
      }}
    >
      {done && (
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
          className="inline mr-1"
          aria-hidden="true"
        >
          <path
            d="M1.5 4.5l2 2L7 2"
            stroke="var(--success)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4.5 9l3-3-3-3" stroke="var(--border-bright)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
