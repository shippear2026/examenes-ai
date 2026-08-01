"use client";

import { useMemo, useState } from "react";
import type {
  Difficulty,
  GenerateResponse,
  GradeItem,
  GradeResponse,
  GradeResult,
  Question,
  QuestionType,
} from "@/lib/types";

type Phase = "config" | "loading" | "exam";

/** Respuesta del usuario por pregunta. */
type Answer = number | boolean | string | null;

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Opción múltiple" },
  { value: "true_false", label: "Verdadero / Falso" },
  { value: "short_answer", label: "Desarrollo" },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Media" },
  { value: "dificil", label: "Difícil" },
];

export function ExamStudio({ sourceText }: { sourceText: string }) {
  const [phase, setPhase] = useState<Phase>("config");
  const [error, setError] = useState<string | null>(null);

  // Config
  const [types, setTypes] = useState<QuestionType[]>([
    "multiple_choice",
    "true_false",
    "short_answer",
  ]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("media");

  // Examen
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradeResults, setGradeResults] = useState<Record<number, GradeResult>>(
    {},
  );

  function toggleType(t: QuestionType) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  async function generate() {
    setError(null);
    setPhase("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, numQuestions, types, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo generar el examen.");
        setPhase("config");
        return;
      }
      const qs = (data as GenerateResponse).questions;
      setQuestions(qs);
      setAnswers(qs.map((q) => (q.type === "short_answer" ? "" : null)));
      setSubmitted(false);
      setGradeResults({});
      setPhase("exam");
    } catch {
      setError("No se pudo conectar con el servidor.");
      setPhase("config");
    }
  }

  function setAnswer(i: number, value: Answer) {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  async function submit() {
    setError(null);
    // Corregir respuestas de desarrollo con IA.
    const shortItems: GradeItem[] = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.type === "short_answer")
      .map(({ q, i }) => ({
        index: i,
        question: q.question,
        modelAnswer: q.modelAnswer ?? "",
        keyPoints: q.keyPoints,
        userAnswer: String(answers[i] ?? ""),
      }));

    if (shortItems.length > 0) {
      setGrading(true);
      try {
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: shortItems }),
        });
        const data = await res.json();
        if (res.ok) {
          const map: Record<number, GradeResult> = {};
          for (const r of (data as GradeResponse).results) map[r.index] = r;
          setGradeResults(map);
        } else {
          setError(
            "No se pudieron corregir las respuestas de desarrollo, pero igual ves el resto.",
          );
        }
      } catch {
        setError("No se pudo corregir el desarrollo (sin conexión).");
      } finally {
        setGrading(false);
      }
    }
    setSubmitted(true);
  }

  function restart() {
    setPhase("config");
    setQuestions([]);
    setAnswers([]);
    setSubmitted(false);
    setGradeResults({});
    setError(null);
  }

  function retry() {
    setAnswers(questions.map((q) => (q.type === "short_answer" ? "" : null)));
    setSubmitted(false);
    setGradeResults({});
  }

  // Puntaje
  const score = useMemo(() => {
    if (!submitted) return null;
    let points = 0;
    questions.forEach((q, i) => {
      if (q.type === "multiple_choice") {
        if (answers[i] === q.correctIndex) points += 1;
      } else if (q.type === "true_false") {
        if (answers[i] === q.correctBoolean) points += 1;
      } else {
        const v = gradeResults[i]?.verdict;
        if (v === "correct") points += 1;
        else if (v === "partial") points += 0.5;
      }
    });
    return { points, total: questions.length };
  }, [submitted, questions, answers, gradeResults]);

  /* ----------------------------- Config UI ----------------------------- */
  if (phase === "config" || phase === "loading") {
    const loading = phase === "loading";
    return (
      <section className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Generar examen
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Creamos preguntas a partir del material que subiste y las respondés en
          pantalla con corrección automática.
        </p>

        <div className="mt-6 flex flex-col gap-6">
          {/* Tipos */}
          <fieldset>
            <legend className="text-sm font-medium text-card-foreground">
              Tipos de pregunta
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const active = types.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
                    aria-pressed={active}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-card-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-6">
            {/* Cantidad */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="numQuestions"
                className="text-sm font-medium text-card-foreground"
              >
                Cantidad de preguntas
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="numQuestions"
                  type="range"
                  min={1}
                  max={20}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-48 accent-[var(--color-primary)]"
                />
                <span className="w-8 text-center text-sm font-semibold text-card-foreground">
                  {numQuestions}
                </span>
              </div>
            </div>

            {/* Dificultad */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-card-foreground">
                Dificultad
              </span>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    aria-pressed={difficulty === opt.value}
                    className={`rounded-[var(--radius)] border px-3 py-1.5 text-sm font-medium transition-colors ${
                      difficulty === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-card-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={generate}
              disabled={loading || types.length === 0}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
                  aria-hidden="true"
                />
              )}
              {loading ? "Generando preguntas…" : "Generar examen"}
            </button>
            {types.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Elegí al menos un tipo de pregunta.
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ Exam UI ------------------------------ */
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Examen · {questions.length} pregunta
          {questions.length === 1 ? "" : "s"}
        </h2>
        <button
          type="button"
          onClick={restart}
          className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Nuevo examen
        </button>
      </div>

      {/* Resultado */}
      {submitted && score && (
        <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-5">
          <p className="text-sm text-muted-foreground">Tu puntaje</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {score.points} / {score.total}
            <span className="ml-2 text-lg font-medium text-muted-foreground">
              ({Math.round((score.points / score.total) * 100)}%)
            </span>
          </p>
        </div>
      )}

      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          index={i}
          question={q}
          answer={answers[i]}
          submitted={submitted}
          grade={gradeResults[i]}
          onAnswer={(v) => setAnswer(i, v)}
        />
      ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={grading}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {grading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
                aria-hidden="true"
              />
            )}
            {grading ? "Corrigiendo…" : "Corregir examen"}
          </button>
        ) : (
          <button
            type="button"
            onClick={retry}
            className="rounded-[var(--radius)] border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Reintentar
          </button>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tarjeta de pregunta                                                       */
/* -------------------------------------------------------------------------- */

function QuestionCard({
  index,
  question,
  answer,
  submitted,
  grade,
  onAnswer,
}: {
  index: number;
  question: Question;
  answer: Answer;
  submitted: boolean;
  grade: GradeResult | undefined;
  onAnswer: (value: Answer) => void;
}) {
  const isCorrect =
    question.type === "multiple_choice"
      ? answer === question.correctIndex
      : question.type === "true_false"
        ? answer === question.correctBoolean
        : grade?.verdict === "correct";

  return (
    <article className="rounded-[var(--radius)] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-card-foreground text-pretty">
          <span className="text-muted-foreground">{index + 1}. </span>
          {question.question}
        </h3>
        {submitted && (
          <VerdictBadge
            type={question.type}
            correct={isCorrect}
            verdict={grade?.verdict}
          />
        )}
      </div>

      <div className="mt-4">
        {question.type === "multiple_choice" && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt, oi) => {
              const selected = answer === oi;
              const correct = submitted && oi === question.correctIndex;
              const wrong = submitted && selected && oi !== question.correctIndex;
              return (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors ${
                    correct
                      ? "border-primary bg-primary/10 text-card-foreground"
                      : wrong
                        ? "border-destructive bg-destructive/10 text-card-foreground"
                        : selected
                          ? "border-primary bg-primary/5 text-card-foreground"
                          : "border-border text-card-foreground hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${index}`}
                    checked={selected}
                    disabled={submitted}
                    onChange={() => onAnswer(oi)}
                    className="accent-[var(--color-primary)]"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "true_false" && (
          <div className="flex gap-2">
            {[true, false].map((val) => {
              const selected = answer === val;
              const correct = submitted && val === question.correctBoolean;
              const wrong =
                submitted && selected && val !== question.correctBoolean;
              return (
                <button
                  key={String(val)}
                  type="button"
                  disabled={submitted}
                  onClick={() => onAnswer(val)}
                  className={`rounded-[var(--radius)] border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-default ${
                    correct
                      ? "border-primary bg-primary/10 text-card-foreground"
                      : wrong
                        ? "border-destructive bg-destructive/10 text-card-foreground"
                        : selected
                          ? "border-primary bg-primary/5 text-card-foreground"
                          : "border-border text-card-foreground hover:bg-muted"
                  }`}
                >
                  {val ? "Verdadero" : "Falso"}
                </button>
              );
            })}
          </div>
        )}

        {question.type === "short_answer" && (
          <textarea
            value={String(answer ?? "")}
            disabled={submitted}
            onChange={(e) => onAnswer(e.target.value)}
            rows={4}
            placeholder="Escribí tu respuesta…"
            className="w-full resize-y rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none transition-colors focus:border-primary disabled:opacity-70"
          />
        )}
      </div>

      {/* Corrección */}
      {submitted && (
        <div className="mt-4 flex flex-col gap-2 rounded-[var(--radius)] bg-muted/40 p-4 text-sm">
          {question.type === "short_answer" && (
            <>
              {grade?.feedback && (
                <p className="text-card-foreground">
                  <span className="font-semibold">Devolución: </span>
                  {grade.feedback}
                </p>
              )}
              {question.modelAnswer && (
                <p className="text-card-foreground">
                  <span className="font-semibold">Respuesta modelo: </span>
                  {question.modelAnswer}
                </p>
              )}
            </>
          )}
          <p className="text-muted-foreground">
            <span className="font-semibold text-card-foreground">
              Explicación:{" "}
            </span>
            {question.explanation}
          </p>
          {question.reference && (
            <p className="text-xs text-muted-foreground">
              Fuente: {question.reference}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function VerdictBadge({
  type,
  correct,
  verdict,
}: {
  type: QuestionType;
  correct: boolean;
  verdict: GradeResult["verdict"] | undefined;
}) {
  if (type === "short_answer") {
    if (verdict === "correct")
      return <Badge tone="ok">Correcta</Badge>;
    if (verdict === "partial")
      return <Badge tone="warn">Parcial</Badge>;
    if (verdict === "incorrect")
      return <Badge tone="bad">Incorrecta</Badge>;
    return <Badge tone="warn">Sin corregir</Badge>;
  }
  return correct ? (
    <Badge tone="ok">Correcta</Badge>
  ) : (
    <Badge tone="bad">Incorrecta</Badge>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "bg-primary/10 text-primary"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-destructive/10 text-destructive";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}
