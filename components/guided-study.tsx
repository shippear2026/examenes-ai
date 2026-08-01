"use client";

import { useMemo, useRef, useState } from "react";
import type {
  Difficulty,
  ExtractResponse,
  GenerateResponse,
  GradeItem,
  GradeResponse,
  GradeResult,
  Question,
} from "@/lib/types";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  FileIcon,
  RefreshIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "@/components/icons";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Cada paso del asistente. Uno a la vez. */
type Step =
  | "welcome"
  | "upload"
  | "reading"
  | "ready"
  | "setup"
  | "generating"
  | "exam"
  | "results";

/** Respuesta del usuario a una pregunta. */
type Answer = number | boolean | string | null;

const COUNT_CHOICES = [
  { value: 3, label: "Pocas", hint: "3 preguntas" },
  { value: 6, label: "Normal", hint: "6 preguntas" },
  { value: 10, label: "Muchas", hint: "10 preguntas" },
];

const DIFFICULTY_CHOICES: { value: Difficulty; label: string; hint: string }[] =
  [
    { value: "facil", label: "Fácil", hint: "Para empezar tranquilo" },
    { value: "media", label: "Normal", hint: "Un buen desafío" },
    { value: "dificil", label: "Difícil", hint: "Para poner a prueba" },
  ];

export function GuidedStudy() {
  const [step, setStep] = useState<Step>("welcome");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Material
  const [fileName, setFileName] = useState<string>("");
  const [extracted, setExtracted] = useState<ExtractResponse[]>([]);

  // Preferencias
  const [numQuestions, setNumQuestions] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>("media");

  // Examen
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [current, setCurrent] = useState(0);
  const [grading, setGrading] = useState(false);
  const [gradeResults, setGradeResults] = useState<Record<number, GradeResult>>(
    {},
  );

  const combinedText = useMemo(
    () =>
      extracted
        .map((r) => `### ${r.filename}\n${r.fullText}`)
        .join("\n\n"),
    [extracted],
  );

  /* --------------------------- Subir material --------------------------- */
  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (file.type !== "application/pdf") {
      setError(
        "Ese archivo no sirve. Necesito un archivo PDF (suele terminar en “.pdf”). Probá de nuevo.",
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        "El archivo es muy grande. Probá con uno más chico (menos de 10 MB).",
      );
      return;
    }

    setFileName(file.name);
    setStep("reading");

    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/extract", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.error ??
            "No pude leer ese archivo. Puede que sea una foto escaneada. Probá con otro.",
        );
        setStep("upload");
        return;
      }
      setExtracted([data as ExtractResponse]);
      setStep("ready");
    } catch {
      setError("No me pude conectar. Revisá tu internet y probá otra vez.");
      setStep("upload");
    }
  }

  /* ---------------------------- Generar examen -------------------------- */
  async function generate() {
    setError(null);
    setStep("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: combinedText,
          numQuestions,
          types: ["multiple_choice", "true_false", "short_answer"],
          difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No pude crear las preguntas. Probá de nuevo.");
        setStep("setup");
        return;
      }
      const qs = (data as GenerateResponse).questions;
      setQuestions(qs);
      setAnswers(qs.map((q) => (q.type === "short_answer" ? "" : null)));
      setCurrent(0);
      setGradeResults({});
      setStep("exam");
    } catch {
      setError("No me pude conectar. Revisá tu internet y probá otra vez.");
      setStep("setup");
    }
  }

  function setAnswer(i: number, value: Answer) {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  /* ----------------------------- Terminar ------------------------------- */
  async function finish() {
    setError(null);
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
        }
      } catch {
        // Si falla la corrección del desarrollo, igual mostramos el resultado.
      } finally {
        setGrading(false);
      }
    }
    setStep("results");
  }

  function practiceAgain() {
    setAnswers(questions.map((q) => (q.type === "short_answer" ? "" : null)));
    setCurrent(0);
    setGradeResults({});
    setError(null);
    setStep("exam");
  }

  function startOver() {
    setStep("welcome");
    setFileName("");
    setExtracted([]);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setGradeResults({});
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const score = useMemo(() => {
    if (step !== "results") return null;
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
  }, [step, questions, answers, gradeResults]);

  // Input de archivo, siempre disponible (oculto).
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        handleFile(e.target.files?.[0]);
        if (inputRef.current) inputRef.current.value = "";
      }}
      className="sr-only"
      aria-label="Elegir archivo de estudio"
    />
  );

  /* =============================== Vistas =============================== */

  if (step === "welcome") {
    return (
      <Shell>
        {fileInput}
        <div className="flex flex-col items-center gap-8 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookIcon className="h-12 w-12" />
          </span>
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Estudiá con tus propios apuntes
            </h1>
            <p className="mx-auto max-w-xl text-pretty text-xl leading-relaxed text-muted-foreground">
              Yo te ayudo. Vos me pasás tu material de estudio y te preparo
              preguntas para practicar. Es muy fácil: te voy guiando paso a
              paso.
            </p>
          </div>
          <BigButton onClick={() => setStep("upload")}>
            Empezar
            <ArrowRightIcon className="h-6 w-6" />
          </BigButton>
        </div>
      </Shell>
    );
  }

  if (step === "upload") {
    return (
      <Shell>
        {fileInput}
        <StepHeader n={1} title="Elegí tu material de estudio" />
        <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
          Buscá en tu computadora el archivo con tus apuntes. Tiene que ser un
          archivo <strong className="text-foreground">PDF</strong>. Cuando estés
          listo, tocá el botón de abajo.
        </p>

        {error && <ErrorNote>{error}</ErrorNote>}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-4 border-dashed border-border bg-card px-6 py-14 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-visible:border-primary"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadIcon className="h-10 w-10" />
          </span>
          <span className="text-2xl font-bold text-foreground">
            Buscar mi archivo
          </span>
          <span className="text-lg text-muted-foreground">
            Tocá acá para abrir tus archivos
          </span>
        </button>

        <BackLink onClick={() => setStep("welcome")} />
      </Shell>
    );
  }

  if (step === "reading") {
    return (
      <Shell>
        <StepHeader n={1} title="Estoy leyendo tu material" />
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <Spinner />
          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold text-foreground">
              Esperá un momentito…
            </p>
            <p className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
              <FileIcon className="h-5 w-5 shrink-0" />
              <span className="max-w-xs truncate">{fileName}</span>
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === "ready") {
    const pages = extracted[0]?.totalPages ?? 0;
    return (
      <Shell>
        <StepHeader n={1} title="¡Listo! Ya leí tu material" />
        <div className="flex flex-col items-center gap-6 rounded-2xl border-2 border-primary/30 bg-primary/5 px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CheckIcon className="h-10 w-10" />
          </span>
          <div className="flex flex-col gap-2">
            <p className="flex items-center justify-center gap-2 text-xl font-semibold text-foreground">
              <FileIcon className="h-5 w-5 shrink-0" />
              <span className="max-w-xs truncate">{fileName}</span>
            </p>
            <p className="text-lg text-muted-foreground">
              Leí {pages} página{pages === 1 ? "" : "s"}. Ya podemos preparar tus
              preguntas.
            </p>
          </div>
        </div>
        <BigButton onClick={() => setStep("setup")}>
          Continuar
          <ArrowRightIcon className="h-6 w-6" />
        </BigButton>
        <BackLink label="Elegir otro archivo" onClick={() => setStep("upload")} />
      </Shell>
    );
  }

  if (step === "setup") {
    return (
      <Shell>
        {fileInput}
        <StepHeader n={2} title="¿Cómo querés practicar?" />

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold text-foreground">
            ¿Cuántas preguntas querés?
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {COUNT_CHOICES.map((c) => (
              <ChoiceCard
                key={c.value}
                active={numQuestions === c.value}
                label={c.label}
                hint={c.hint}
                onClick={() => setNumQuestions(c.value)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold text-foreground">
            ¿Qué tan difícil?
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DIFFICULTY_CHOICES.map((c) => (
              <ChoiceCard
                key={c.value}
                active={difficulty === c.value}
                label={c.label}
                hint={c.hint}
                onClick={() => setDifficulty(c.value)}
              />
            ))}
          </div>
        </div>

        <BigButton onClick={generate}>
          <SparklesIcon className="h-6 w-6" />
          Crear mis preguntas
        </BigButton>
        <BackLink onClick={() => setStep("ready")} />
      </Shell>
    );
  }

  if (step === "generating") {
    return (
      <Shell>
        <StepHeader n={2} title="Estoy preparando tus preguntas" />
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <Spinner />
          <p className="text-xl font-semibold text-foreground">
            Dame unos segundos…
          </p>
          <p className="max-w-sm text-lg text-muted-foreground text-pretty">
            Estoy leyendo tus apuntes y pensando buenas preguntas para vos.
          </p>
        </div>
      </Shell>
    );
  }

  if (step === "exam") {
    const q = questions[current];
    const total = questions.length;
    const isLast = current === total - 1;
    const answer = answers[current];
    const answered =
      q.type === "short_answer"
        ? String(answer ?? "").trim().length > 0
        : answer !== null;

    return (
      <Shell wide>
        {/* Progreso */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground">
              Pregunta {current + 1} de {total}
            </p>
            <button
              type="button"
              onClick={startOver}
              className="text-base font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Salir
            </button>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={current + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-pretty text-2xl font-bold leading-snug text-foreground">
            {q.question}
          </h2>

          {q.type === "multiple_choice" && (
            <div className="flex flex-col gap-3">
              {q.options.map((opt, oi) => (
                <OptionButton
                  key={oi}
                  selected={answer === oi}
                  label={opt}
                  onClick={() => setAnswer(current, oi)}
                />
              ))}
            </div>
          )}

          {q.type === "true_false" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OptionButton
                selected={answer === true}
                label="Verdadero"
                onClick={() => setAnswer(current, true)}
              />
              <OptionButton
                selected={answer === false}
                label="Falso"
                onClick={() => setAnswer(current, false)}
              />
            </div>
          )}

          {q.type === "short_answer" && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="respuesta"
                className="text-lg text-muted-foreground"
              >
                Escribí tu respuesta con tus palabras:
              </label>
              <textarea
                id="respuesta"
                value={String(answer ?? "")}
                onChange={(e) => setAnswer(current, e.target.value)}
                rows={5}
                placeholder="Empezá a escribir acá…"
                className="w-full resize-y rounded-xl border-2 border-border bg-background px-4 py-3 text-lg text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
          )}
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {/* Navegación */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-5 py-3 text-lg font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Anterior
          </button>

          {!isLast ? (
            <BigButton
              inline
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            >
              Siguiente
              <ArrowRightIcon className="h-6 w-6" />
            </BigButton>
          ) : (
            <BigButton inline onClick={finish} disabled={grading}>
              {grading ? (
                <>
                  <SpinnerSmall />
                  Revisando…
                </>
              ) : (
                <>
                  Ver mi resultado
                  <CheckIcon className="h-6 w-6" />
                </>
              )}
            </BigButton>
          )}
        </div>

        {!answered && (
          <p className="text-center text-base text-muted-foreground">
            Podés responder o pasar a la siguiente. Al final vemos cómo te fue.
          </p>
        )}
      </Shell>
    );
  }

  // step === "results"
  const pct = score ? Math.round((score.points / score.total) * 100) : 0;
  const cheer =
    pct >= 80
      ? "¡Excelente trabajo! Sabés muy bien el tema."
      : pct >= 50
        ? "¡Muy bien! Vas por buen camino, seguí practicando."
        : "No pasa nada, practicar es la mejor forma de aprender. ¡Probá otra vez!";

  return (
    <Shell wide>
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xl font-semibold text-muted-foreground">
          Tu resultado
        </p>
        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-8 border-primary/20 bg-card">
          <span className="text-5xl font-bold text-foreground">
            {score?.points}
            <span className="text-2xl text-muted-foreground">
              /{score?.total}
            </span>
          </span>
          <span className="text-lg font-semibold text-primary">{pct}%</span>
        </div>
        <p className="max-w-md text-pretty text-xl leading-relaxed text-foreground">
          {cheer}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Repasá tus respuestas
        </h2>
        {questions.map((q, i) => (
          <ReviewCard
            key={i}
            index={i}
            question={q}
            answer={answers[i]}
            grade={gradeResults[i]}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <BigButton inline onClick={practiceAgain}>
          <RefreshIcon className="h-6 w-6" />
          Practicar de nuevo
        </BigButton>
        <button
          type="button"
          onClick={startOver}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Empezar de cero
        </button>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Piezas reutilizables                                                      */
/* -------------------------------------------------------------------------- */

function Shell({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-col gap-6 ${
        wide ? "max-w-2xl" : "max-w-xl"
      }`}
    >
      {children}
    </div>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-base font-bold uppercase tracking-wide text-primary">
        Paso {n} de 2
      </span>
      <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
    </div>
  );
}

function BigButton({
  children,
  onClick,
  disabled,
  inline,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-8 py-4 text-xl font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
        inline ? "" : "w-full"
      }`}
    >
      {children}
    </button>
  );
}

function ChoiceCard({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-5 text-center transition-colors ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:bg-muted"
      }`}
    >
      <span
        className={`text-xl font-bold ${
          active ? "text-primary" : "text-foreground"
        }`}
      >
        {label}
      </span>
      <span className="text-base text-muted-foreground">{hint}</span>
    </button>
  );
}

function OptionButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left text-lg transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border"
        }`}
        aria-hidden="true"
      >
        {selected && <CheckIcon className="h-4 w-4" />}
      </span>
      <span>{label}</span>
    </button>
  );
}

function ReviewCard({
  index,
  question,
  answer,
  grade,
}: {
  index: number;
  question: Question;
  answer: Answer;
  grade: GradeResult | undefined;
}) {
  const correct =
    question.type === "multiple_choice"
      ? answer === question.correctIndex
      : question.type === "true_false"
        ? answer === question.correctBoolean
        : grade?.verdict === "correct";
  const partial = question.type === "short_answer" && grade?.verdict === "partial";

  const tone = correct ? "ok" : partial ? "warn" : "bad";
  const yourAnswerText =
    question.type === "multiple_choice"
      ? typeof answer === "number"
        ? question.options[answer]
        : "No respondiste"
      : question.type === "true_false"
        ? answer === true
          ? "Verdadero"
          : answer === false
            ? "Falso"
            : "No respondiste"
        : String(answer ?? "").trim() || "No respondiste";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-pretty text-lg font-semibold text-foreground">
          <span className="text-muted-foreground">{index + 1}. </span>
          {question.question}
        </h3>
        <ResultBadge tone={tone} />
      </div>

      <p className="text-base text-muted-foreground">
        <span className="font-semibold text-foreground">Tu respuesta: </span>
        {yourAnswerText}
      </p>

      {question.type === "short_answer" && grade?.feedback && (
        <p className="text-base text-foreground">
          <span className="font-semibold">Devolución: </span>
          {grade.feedback}
        </p>
      )}

      <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-4">
        {question.type === "multiple_choice" &&
          typeof question.correctIndex === "number" && (
            <p className="text-base text-foreground">
              <span className="font-semibold">Respuesta correcta: </span>
              {question.options[question.correctIndex]}
            </p>
          )}
        {question.type === "true_false" && (
          <p className="text-base text-foreground">
            <span className="font-semibold">Respuesta correcta: </span>
            {question.correctBoolean ? "Verdadero" : "Falso"}
          </p>
        )}
        {question.type === "short_answer" && question.modelAnswer && (
          <p className="text-base text-foreground">
            <span className="font-semibold">Respuesta modelo: </span>
            {question.modelAnswer}
          </p>
        )}
        <p className="text-base text-muted-foreground">
          <span className="font-semibold text-foreground">Por qué: </span>
          {question.explanation}
        </p>
        {question.reference && (
          <p className="text-sm text-muted-foreground">
            De tu material: {question.reference}
          </p>
        )}
      </div>
    </article>
  );
}

function ResultBadge({ tone }: { tone: "ok" | "warn" | "bad" }) {
  if (tone === "ok")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
        <CheckIcon className="h-4 w-4" /> Bien
      </span>
    );
  if (tone === "warn")
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-600 dark:text-amber-400">
        Casi
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-sm font-bold text-destructive">
      <XIcon className="h-4 w-4" /> A repasar
    </span>
  );
}

function BackLink({
  onClick,
  label = "Volver",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 self-start text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeftIcon className="h-5 w-5" />
      {label}
    </button>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 px-4 py-3 text-lg text-foreground"
    >
      <XIcon className="mt-1 h-5 w-5 shrink-0 text-destructive" />
      <span>{children}</span>
    </p>
  );
}

function Spinner() {
  return (
    <span
      className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary"
      aria-hidden="true"
    />
  );
}

function SpinnerSmall() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
      aria-hidden="true"
    />
  );
}
