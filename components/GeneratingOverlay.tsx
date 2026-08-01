"use client";

export type GenerationPhase = "extract" | "generate" | "done";

interface GeneratingOverlayProps {
  /** Fase real en curso del pipeline. */
  phase: GenerationPhase;
  /** Mensaje de error si el pipeline falló (null = sin error). */
  error?: string | null;
  /** Reintentar todo el proceso. */
  onRetry?: () => void;
  /** Cancelar y volver al formulario. */
  onCancel?: () => void;
}

const steps = [
  {
    id: "extract",
    label: "Analizando tu PDF...",
    sublabel: "Extrayendo el texto de la bibliografía",
  },
  {
    id: "generate",
    label: "Agentes de IA trabajando...",
    sublabel: "El generador crea las preguntas y el supervisor las revisa",
  },
] as const;

function phaseIndex(phase: GenerationPhase): number {
  if (phase === "extract") return 0;
  if (phase === "generate") return 1;
  return 2; // done
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M9 2C5.13401 2 2 5.13401 2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="var(--success)" fillOpacity="0.15" />
      <path d="M5 8L7 10L11 6" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#ef4444" fillOpacity="0.15" />
      <path d="M10 5.5v5M10 13.5v.5" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function GeneratingOverlay({
  phase,
  error,
  onRetry,
  onCancel,
}: GeneratingOverlayProps) {
  const activeIndex = phaseIndex(phase);
  const progress = error
    ? 100
    : phase === "done"
      ? 100
      : phase === "generate"
        ? 65
        : 25;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(9,9,15,0.85)", backdropFilter: "blur(8px)" }}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-8 flex flex-col gap-6"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-bright)",
          boxShadow:
            "0 0 0 1px var(--accent-border), 0 24px 64px rgba(0,0,0,0.6), 0 0 80px var(--accent-glow)",
        }}
      >
        {/* Header */}
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              backgroundColor: error ? "rgba(239,68,68,0.12)" : "var(--accent-glow)",
              border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "var(--accent-border)"}`,
              color: error ? "#f87171" : "var(--accent-bright)",
            }}
          >
            {!error && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--accent-bright)" }}
              />
            )}
            {error ? "Ocurrió un problema" : "Procesando con IA"}
          </div>
          <h2 className="text-lg font-semibold text-balance" style={{ color: "var(--foreground)" }}>
            {error ? "No pudimos generar el examen" : "Generando tu examen"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {error ? error : "Leemos el PDF y dos agentes de IA arman el examen"}
          </p>
        </div>

        {error ? (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-start gap-3 rounded-xl p-3.5"
              style={{
                backgroundColor: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <div className="mt-0.5 shrink-0">
                <ErrorIcon />
              </div>
              <p className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                {error}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright cursor-pointer"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-bright)",
                  color: "var(--foreground)",
                }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px var(--accent-glow)",
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Steps */}
            <div className="flex flex-col gap-3">
              {steps.map((step, index) => {
                const isDone = index < activeIndex;
                const isActive = index === activeIndex;
                const isPending = index > activeIndex;

                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 rounded-xl p-3.5 transition-all duration-300"
                    style={{
                      backgroundColor: isActive
                        ? "var(--accent-glow)"
                        : isDone
                          ? "rgba(34,197,94,0.05)"
                          : "var(--surface-raised)",
                      border: `1px solid ${
                        isActive
                          ? "var(--accent-border)"
                          : isDone
                            ? "rgba(34,197,94,0.2)"
                            : "var(--border)"
                      }`,
                      opacity: isPending ? 0.45 : 1,
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckIcon />
                      ) : isActive ? (
                        <span style={{ color: "var(--accent-bright)" }}>
                          <Spinner />
                        </span>
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ borderColor: "var(--border-bright)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{
                          color: isActive
                            ? "var(--accent-bright)"
                            : isDone
                              ? "var(--success)"
                              : "var(--muted)",
                        }}
                      >
                        {step.label}
                      </p>
                      {(isActive || isDone) && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {step.sublabel}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-in-out"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, var(--accent) 0%, var(--accent-bright) 100%)",
                    boxShadow: "0 0 8px var(--accent)",
                  }}
                />
              </div>
              <p className="text-xs text-right mt-1.5" style={{ color: "var(--muted)" }}>
                {progress}%
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
