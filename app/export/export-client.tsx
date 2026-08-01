"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  PLANTILLAS,
  VERSIONES,
  puntajeTotal,
  type Examen,
  type Plantilla,
  type Version,
} from "@/lib/exam"

export function ExportClient({ examen }: { examen: Examen }) {
  const [plantilla, setPlantilla] = useState<Plantilla>("moderna")
  const [version, setVersion] = useState<Version>("A")
  const [incluirClave, setIncluirClave] = useState(true)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastUrl = useRef<string | null>(null)

  const generar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examen, plantilla, version, incluirClave }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const blob = await res.blob()
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
      const url = URL.createObjectURL(blob)
      lastUrl.current = url
      setPreviewUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el PDF")
    } finally {
      setLoading(false)
    }
  }, [examen, plantilla, version, incluirClave])

  // Regenera el preview automáticamente cuando cambian las opciones
  useEffect(() => {
    generar()
  }, [generar])

  useEffect(() => {
    return () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
    }
  }, [])

  const total = puntajeTotal(examen)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Panel de controles */}
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Examen</span>
          <span className="font-semibold leading-tight">{examen.titulo}</span>
          <span className="text-sm text-muted">
            {examen.materia} · {examen.preguntas.length} preguntas
            {total > 0 ? ` · ${total} pts` : ""}
          </span>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Plantilla</legend>
          {PLANTILLAS.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                plantilla === p.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="plantilla"
                  className="accent-primary"
                  checked={plantilla === p.id}
                  onChange={() => setPlantilla(p.id)}
                />
                <span className="font-medium">{p.nombre}</span>
              </span>
              <span className="ml-6 text-xs leading-relaxed text-muted">{p.descripcion}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Versión</legend>
          <div className="flex gap-2">
            {VERSIONES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersion(v)}
                aria-pressed={version === v}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                  version === v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-xs leading-relaxed text-muted">
            Cada versión baraja el orden de preguntas y opciones de forma reproducible.
          </span>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={incluirClave}
            onChange={(e) => setIncluirClave(e.target.checked)}
          />
          Incluir hoja de clave de corrección
        </label>

        <a
          href={previewUrl ?? "#"}
          download={`examen-${plantilla}-v${version}.pdf`}
          aria-disabled={!previewUrl}
          className={`mt-1 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            previewUrl
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "pointer-events-none bg-primary/40 text-primary-foreground"
          }`}
        >
          {loading ? "Generando…" : "Descargar PDF"}
        </a>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Preview */}
      <div className="relative min-h-[600px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70 text-sm text-muted backdrop-blur-sm">
            Generando vista previa…
          </div>
        )}
        {previewUrl ? (
          <iframe
            key={previewUrl}
            src={`${previewUrl}#toolbar=0`}
            title="Vista previa del examen"
            className="h-full min-h-[600px] w-full"
          />
        ) : (
          <div className="flex h-full min-h-[600px] items-center justify-center text-sm text-muted">
            La vista previa aparecerá acá.
          </div>
        )}
      </div>
    </div>
  )
}
