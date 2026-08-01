"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DropZone from "./DropZone";
import TemplateSelector, { type TemplateId } from "./TemplateSelector";
import GeneratingOverlay from "./GeneratingOverlay";

export default function LandingPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState<TemplateId>("university");
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = !!file && prompt.trim().length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setIsGenerating(true);
  };

  const handleGenerateComplete = useCallback(() => {
    setIsGenerating(false);
    router.push("/editor");
  }, [router]);

  return (
    <>
      {isGenerating && (
        <GeneratingOverlay onComplete={handleGenerateComplete} />
      )}

      <div className="flex flex-col flex-1 min-h-screen">
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
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1L10.5 6H15L11.5 9.5L12.8 14.5L8 11.8L3.2 14.5L4.5 9.5L1 6H5.5L8 1Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              Copiloto de Exámenes
            </span>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "var(--accent-glow)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-bright)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--accent-bright)" }}
            />
            2 agentes de IA activos
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
          <div className="w-full max-w-2xl flex flex-col gap-10">

            {/* Hero */}
            <div className="text-center flex flex-col gap-3">
              <div
                className="inline-flex items-center gap-2 self-center px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "var(--accent-glow)",
                  border: "1px solid var(--accent-border)",
                  color: "var(--accent-bright)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L7.5 4.5H11L8.5 6.5L9.3 10L6 8.2L2.7 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="currentColor"/>
                </svg>
                Powered por IA multiagente
              </div>
              <h1
                className="text-4xl sm:text-5xl font-bold tracking-tight text-balance leading-tight"
                style={{ color: "var(--foreground)" }}
              >
                Tu examen,{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--accent-bright) 0%, #818cf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  generado en segundos
                </span>
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed text-pretty max-w-xl mx-auto"
                style={{ color: "var(--muted)" }}
              >
                Subí tu bibliografía, describí qué querés evaluar, y dos agentes de IA
                armarán y revisarán el examen por vos.
              </p>
            </div>

            {/* Form card */}
            <div
              className="rounded-2xl flex flex-col gap-7 p-6 sm:p-8"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-bright)",
              }}
            >

              {/* Step 1 - Upload */}
              <section aria-labelledby="upload-heading">
                <div className="flex items-center gap-2.5 mb-3">
                  <StepBadge number={1} />
                  <h2
                    id="upload-heading"
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Subí tu bibliografía
                  </h2>
                </div>
                <DropZone file={file} onFileChange={setFile} />
              </section>

              <Divider />

              {/* Step 2 - Prompt */}
              <section aria-labelledby="prompt-heading">
                <div className="flex items-center gap-2.5 mb-3">
                  <StepBadge number={2} />
                  <h2
                    id="prompt-heading"
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Describí el examen que necesitás
                  </h2>
                </div>
                <textarea
                  id="exam-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: 10 preguntas de opción múltiple sobre el capítulo 3, dificultad media. Incluir una pregunta de desarrollo al final."
                  rows={4}
                  className="w-full rounded-xl text-sm resize-none focus:outline-none transition-all duration-200 leading-relaxed placeholder:text-muted"
                  style={{
                    backgroundColor: "var(--surface-raised)",
                    border: `1.5px solid ${prompt.trim() ? "var(--accent-border)" : "var(--border-bright)"}`,
                    color: "var(--foreground)",
                    padding: "14px 16px",
                    boxShadow: prompt.trim()
                      ? "0 0 0 3px var(--accent-glow)"
                      : "none",
                  }}
                  aria-describedby="prompt-hint"
                />
                <p
                  id="prompt-hint"
                  className="text-xs mt-2 flex items-center gap-1.5"
                  style={{ color: "var(--muted)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6 5.5V8.5M6 4V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Cuanto más detallés, mejor será el resultado
                </p>
              </section>

              <Divider />

              {/* Step 3 - Template */}
              <section aria-labelledby="template-heading">
                <div className="flex items-center gap-2.5 mb-3">
                  <StepBadge number={3} />
                  <h2
                    id="template-heading"
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Elegí una plantilla de diseño
                  </h2>
                </div>
                <TemplateSelector selected={template} onSelect={setTemplate} />
              </section>

              <Divider />

              {/* Generate button */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl font-semibold text-base h-14 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright cursor-pointer disabled:cursor-not-allowed"
                  style={
                    canGenerate
                      ? {
                          background:
                            "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
                          color: "white",
                          boxShadow:
                            "0 4px 24px var(--accent-glow), 0 1px 0 rgba(255,255,255,0.1) inset",
                        }
                      : {
                          backgroundColor: "var(--surface-raised)",
                          color: "var(--muted)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="M9 2L11 7H16L12 10.5L13.5 15.5L9 12.8L4.5 15.5L6 10.5L2 7H7L9 2Z"
                      fill={canGenerate ? "rgba(255,255,255,0.9)" : "currentColor"}
                    />
                  </svg>
                  Generar examen con IA
                </button>

                {!canGenerate && (
                  <p
                    className="text-xs text-center"
                    style={{ color: "var(--muted)" }}
                    aria-live="polite"
                  >
                    {!file && !prompt.trim()
                      ? "Necesitás subir un PDF y describir el examen"
                      : !file
                      ? "Falta subir el archivo PDF"
                      : "Falta describir el examen"}
                  </p>
                )}
              </div>
            </div>

            {/* Footer trust badge */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[
                { icon: "🔒", label: "Tu PDF no se almacena" },
                { icon: "⚡", label: "Listo en ~30 segundos" },
                { icon: "📋", label: "3 versiones A / B / C" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{
        background: "linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)",
        color: "white",
      }}
    >
      {number}
    </div>
  );
}

function Divider() {
  return (
    <div
      className="w-full h-px"
      style={{ backgroundColor: "var(--border)" }}
    />
  );
}
