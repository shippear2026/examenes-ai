"use client";

import { useState, useRef, useEffect } from "react";
import type { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (id: string, changes: Partial<Question>) => void;
  onRegenerate: (id: string) => void;
  onDiscard: (id: string) => void;
}

const TYPE_LABELS: Record<Question["type"], string> = {
  multiple_choice: "Opción múltiple",
  development: "Desarrollo",
  true_false: "Verdadero / Falso",
};

export default function QuestionCard({
  question,
  index,
  onUpdate,
  onRegenerate,
  onDiscard,
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [editOptions, setEditOptions] = useState<string[]>(
    question.options ?? []
  );
  const [editCorrect, setEditCorrect] = useState(
    question.correctAnswer ?? ""
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and resize textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [isEditing]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  function handleSave() {
    onUpdate(question.id, {
      text: editText,
      options: editOptions.length > 0 ? editOptions : undefined,
      correctAnswer: editCorrect || undefined,
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setEditText(question.text);
    setEditOptions(question.options ?? []);
    setEditCorrect(question.correctAnswer ?? "");
    setIsEditing(false);
  }

  function handleOptionTextChange(idx: number, value: string) {
    const next = [...editOptions];
    // If the correct answer was the old text, update it to the new text
    if (editCorrect === next[idx]) setEditCorrect(value);
    next[idx] = value;
    setEditOptions(next);
  }

  const isRegenerating = false; // placeholder for future async state

  return (
    <article
      className="relative rounded-2xl flex flex-col gap-4 transition-all duration-200"
      style={{
        backgroundColor: "var(--surface)",
        border: `1px solid ${isEditing ? "var(--accent-border)" : "var(--border-bright)"}`,
        boxShadow: isEditing ? "0 0 0 3px var(--accent-glow)" : "none",
        padding: "20px 24px",
      }}
      aria-label={`Pregunta ${index + 1}`}
    >
      {/* Top row: type badge + source page chip + supervisor note */}
      <div className="flex flex-wrap items-start gap-2">
        {/* Type badge */}
        <span
          className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 shrink-0"
          style={{
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-bright)",
            color: "var(--muted)",
          }}
        >
          {TYPE_LABELS[question.type]}
        </span>

        {/* Source page chip */}
        {question.sourcePage !== undefined && (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 shrink-0"
            style={{
              backgroundColor: "rgba(79,70,229,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1.5 1h5.2L8.5 3.3V9H1.5V1Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <path d="M6.5 1v2.5H8.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            Pág. {question.sourcePage}
          </span>
        )}

        {/* Supervisor note badge */}
        {question.supervisorNote && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5"
            style={{
              backgroundColor: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.25)",
              color: "#fbbf24",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 3v2.5M5 6.8v.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {question.supervisorNote}
          </span>
        )}
      </div>

      {/* Question number + text */}
      <div className="flex gap-3 items-start">
        {/* Number */}
        <span
          className="text-sm font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
            color: "white",
            fontSize: "11px",
          }}
          aria-hidden="true"
        >
          {index + 1}
        </span>

        {/* Editable text area / static text */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                autoResize(e.target);
              }}
              rows={3}
              className="w-full text-sm leading-relaxed rounded-lg resize-none focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--surface-raised)",
                border: "1.5px solid var(--accent-border)",
                color: "var(--foreground)",
                padding: "10px 12px",
                boxShadow: "0 0 0 3px var(--accent-glow)",
              }}
              aria-label="Texto de la pregunta"
            />
          ) : (
            <p
              className="text-sm leading-relaxed text-pretty cursor-text"
              style={{ color: "var(--foreground)" }}
              onClick={() => setIsEditing(true)}
              title="Clic para editar"
            >
              {question.text}
            </p>
          )}
        </div>
      </div>

      {/* Options (multiple_choice / true_false) */}
      {question.options && question.options.length > 0 && (
        <div className="ml-9 flex flex-col gap-2">
          {(isEditing ? editOptions : question.options).map((opt, idx) => {
            const isCorrect = isEditing
              ? editCorrect === editOptions[idx]
              : opt === question.correctAnswer;

            return (
              <label
                key={idx}
                className="flex items-center gap-2.5 group cursor-pointer"
              >
                {/* Radio button */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={isCorrect}
                  onClick={() => {
                    if (isEditing) setEditCorrect(editOptions[idx]);
                  }}
                  className="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
                  style={{
                    borderColor: isCorrect ? "var(--accent-bright)" : "var(--border-bright)",
                    backgroundColor: isCorrect ? "var(--accent)" : "transparent",
                  }}
                  aria-label={`Marcar como correcta: ${opt}`}
                  disabled={!isEditing}
                >
                  {isCorrect && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "white" }}
                    />
                  )}
                </button>

                {/* Option text */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editOptions[idx]}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    className="flex-1 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors"
                    style={{
                      backgroundColor: isCorrect
                        ? "rgba(124,58,237,0.1)"
                        : "var(--surface-raised)",
                      border: `1px solid ${isCorrect ? "var(--accent-border)" : "var(--border)"}`,
                      color: isCorrect ? "var(--accent-bright)" : "var(--foreground)",
                    }}
                    aria-label={`Opción ${idx + 1}`}
                  />
                ) : (
                  <span
                    className="text-sm leading-snug"
                    style={{
                      color: isCorrect ? "var(--accent-bright)" : "var(--foreground)",
                      fontWeight: isCorrect ? 500 : 400,
                    }}
                  >
                    {opt}
                  </span>
                )}
              </label>
            );
          })}
          {isEditing && (
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Clic en el radio para marcar la respuesta correcta.
            </p>
          )}
        </div>
      )}

      {/* Development hint */}
      {question.type === "development" && !isEditing && (
        <div
          className="ml-9 rounded-lg px-3 py-2 text-xs leading-relaxed"
          style={{
            backgroundColor: "var(--surface-raised)",
            border: "1px dashed var(--border-bright)",
            color: "var(--muted)",
          }}
        >
          Pregunta de desarrollo - respuesta abierta del alumno.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
                color: "white",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Guardar
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-bright"
              style={{
                backgroundColor: "var(--surface-raised)",
                border: "1px solid var(--border-bright)",
                color: "var(--muted)",
              }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            {/* Edit */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-150 hover:border-accent-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
              style={{
                backgroundColor: "var(--surface-raised)",
                border: "1px solid var(--border-bright)",
                color: "var(--foreground)",
              }}
              aria-label="Editar pregunta"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M8.5 1.5l2 2-6.5 6.5H2v-2L8.5 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
              Editar
            </button>

            {/* Regenerate */}
            <button
              type="button"
              onClick={() => onRegenerate(question.id)}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright disabled:opacity-50"
              style={{
                backgroundColor: "rgba(79,70,229,0.08)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#818cf8",
              }}
              aria-label="Regenerar pregunta con IA"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className={isRegenerating ? "animate-spin" : ""}
              >
                <path
                  d="M10.5 6A4.5 4.5 0 1 1 6 1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M6 1.5L8 3.5M6 1.5L8 -0.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Regenerar
            </button>

            {/* Discard */}
            <button
              type="button"
              onClick={() => onDiscard(question.id)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-150 ml-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              style={{
                backgroundColor: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#f87171",
              }}
              aria-label="Descartar pregunta"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M2 3h8M4.5 3V2h3v1M5 5.5v3M7 5.5v3M3 3l.7 6.5a.5.5 0 0 0 .5.5h3.6a.5.5 0 0 0 .5-.5L9 3"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Descartar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
