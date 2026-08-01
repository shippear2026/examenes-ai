"use client";

import { useEffect, useState } from "react";

interface GeneratingOverlayProps {
  /** Se llama cuando la animación de los 2 agentes terminó. */
  onComplete: () => void;
}

const STEPS = [
  {
    id: "generating",
    label: "Agente generador armando preguntas...",
    sublabel: "Analizando bibliografía y creando borradores",
  },
  {
    id: "supervising",
    label: "Agente supervisor revisando...",
    sublabel: "Verificando coherencia, dificultad y cobertura temática",
  },
];

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

export default function GeneratingOverlay({ onComplete }: GeneratingOverlayProps) {
  // 0 = generando, 1 = supervisando, 2 = listo
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Animación secuencial de los dos agentes. El trabajo real corre en paralelo
    // en LandingPage (workRef); acá solo controlamos el ritmo visual.
    const t1 = setTimeout(() => setPhase(1), 2200);
    const t2 = setTimeout(() => setPhase(2), 4400);
    const t3 = setTimeout(() => onComplete(), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const progressPct = phase === 0 ? 30 : phase === 1 ? 75 : 100;

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
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              backgroundColor: "var(--accent-glow)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-bright)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent-bright)" }} />
            Procesando con IA
          </div>
          <h2 className="text-lg font-semibold text-balance" style={{ color: "var(--foreground)" }}>
            Generando tu examen
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Dos agentes de IA trabajando en secuencia
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {STEPS.map((s, index) => {
            const isDone = phase > index;
            const isActive = phase === index;
            const isPending = phase < index;

            return (
              <div
                key={s.id}
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
                    <div className="w-4 h-4 rounded-full border" style={{ borderColor: "var(--border-bright)" }} />
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
                    {s.label}
                  </p>
                  {(isActive || isDone) && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {s.sublabel}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-in-out"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-bright) 100%)",
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
          </div>
          <p className="text-xs text-right mt-1.5" style={{ color: "var(--muted)" }}>
            {progressPct}%
          </p>
        </div>
      </div>
    </div>
  );
}
