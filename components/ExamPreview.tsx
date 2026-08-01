"use client";

import type { Question } from "@/lib/types";
import type { ExamMeta, ExamTema } from "@/lib/mockExam";

export type TemplateStyle = "university" | "secondary" | "minimal";

type Props = {
  tema: ExamTema;
  questions: Question[];
  meta: ExamMeta;
  template: TemplateStyle;
};

const OPTION_LABELS = ["a", "b", "c", "d", "e"];

function getTemplateStyles(template: TemplateStyle) {
  switch (template) {
    case "university":
      return {
        page: "font-serif bg-white text-gray-900 p-10 shadow-lg max-w-[760px] mx-auto",
        header: "border-b-2 border-gray-800 pb-4 mb-6",
        institution: "text-xs uppercase tracking-widest text-gray-500 mb-1",
        title: "text-2xl font-bold text-gray-900 mb-1",
        subtitle: "text-sm text-gray-600",
        metaGrid: "grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600",
        metaLabel: "font-semibold text-gray-800",
        sectionTitle: "text-base font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-1 mb-4",
        questionNumber: "font-bold text-gray-900 mr-2 shrink-0",
        questionText: "text-gray-900 leading-relaxed",
        optionLabel: "text-gray-700 font-medium mr-2 shrink-0",
        optionText: "text-gray-800",
        devLines: "border-b border-dashed border-gray-300",
        badge: "text-xs text-gray-500 italic",
        temaChip: "inline-block bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded",
        footer: "mt-8 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400",
      };
    case "secondary":
      return {
        page: "font-serif bg-white text-gray-900 p-8 shadow-lg max-w-[760px] mx-auto",
        header: "border-b-4 border-blue-700 pb-4 mb-6",
        institution: "text-xs uppercase tracking-wider text-blue-700 font-semibold mb-1",
        title: "text-xl font-bold text-gray-900 mb-1",
        subtitle: "text-sm text-gray-600",
        metaGrid: "grid grid-cols-3 gap-4 mt-4 text-sm text-gray-700",
        metaLabel: "font-semibold text-gray-900",
        sectionTitle: "text-sm font-bold uppercase tracking-wider text-blue-700 border-b-2 border-blue-200 pb-1 mb-4",
        questionNumber: "font-bold text-blue-700 mr-2 shrink-0",
        questionText: "text-gray-900 leading-relaxed",
        optionLabel: "text-blue-600 font-semibold mr-2 shrink-0",
        optionText: "text-gray-800",
        devLines: "border-b border-gray-300",
        badge: "text-xs text-gray-500 italic",
        temaChip: "inline-block bg-blue-700 text-white text-xs font-bold px-2 py-0.5 rounded",
        footer: "mt-8 pt-4 border-t-2 border-blue-100 flex justify-between text-xs text-gray-400",
      };
    case "minimal":
    default:
      return {
        page: "font-sans bg-white text-gray-900 p-10 shadow-md max-w-[760px] mx-auto",
        header: "mb-6",
        institution: "text-xs text-gray-400 tracking-widest uppercase mb-1",
        title: "text-xl font-semibold text-gray-900 mb-1",
        subtitle: "text-sm text-gray-500",
        metaGrid: "grid grid-cols-3 gap-4 mt-4 text-sm text-gray-500",
        metaLabel: "font-medium text-gray-700",
        sectionTitle: "text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4",
        questionNumber: "font-semibold text-gray-400 mr-3 shrink-0 tabular-nums",
        questionText: "text-gray-900 leading-relaxed",
        optionLabel: "text-gray-400 font-medium mr-2 shrink-0",
        optionText: "text-gray-700",
        devLines: "border-b border-gray-200",
        badge: "text-xs text-gray-400 italic",
        temaChip: "inline-block border border-gray-900 text-gray-900 text-xs font-medium px-2 py-0.5 rounded",
        footer: "mt-10 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-300",
      };
  }
}

export default function ExamPreview({ tema, questions, meta, template }: Props) {
  const s = getTemplateStyles(template);

  return (
    <div className={s.page} id="exam-preview">
      {/* Header */}
      <header className={s.header}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={s.institution}>{meta.institution}</p>
            <h1 className={s.title}>{meta.subject}</h1>
            <p className={s.subtitle}>{meta.course}</p>
          </div>
          <span className={s.temaChip}>TEMA {tema}</span>
        </div>

        <div className={s.metaGrid}>
          <div>
            <p className={s.metaLabel}>Fecha</p>
            <p>{meta.date}</p>
          </div>
          <div>
            <p className={s.metaLabel}>Duración</p>
            <p>{meta.duration}</p>
          </div>
          <div>
            <p className={s.metaLabel}>Alumno/a</p>
            <p className="border-b border-gray-400 w-full mt-1">&nbsp;</p>
          </div>
        </div>

        <div className="mt-3">
          <p className={s.metaLabel} style={{ fontSize: "0.75rem" }}>
            Firma / DNI
          </p>
          <p className="border-b border-gray-400 w-48 mt-1">&nbsp;</p>
        </div>
      </header>

      {/* Instructions */}
      <p className={s.badge + " mb-5"}>
        Leé cada pregunta con atención antes de responder. No se permite el uso de material de apoyo.
      </p>

      {/* Questions */}
      <section>
        <p className={s.sectionTitle}>Preguntas — {questions.length} en total</p>

        <ol className="space-y-7">
          {questions.map((q, idx) => (
            <li key={q.id}>
              {/* Question text */}
              <div className="flex items-start gap-0">
                <span className={s.questionNumber}>{idx + 1}.</span>
                <div className="flex-1">
                  <p className={s.questionText}>{q.text}</p>

                  {/* Multiple choice / True-False options */}
                  {q.options && q.options.length > 0 && (
                    <ul className="mt-3 space-y-1.5 pl-1">
                      {q.options.map((opt, oi) => (
                        <li key={oi} className="flex items-start gap-1">
                          <span className={s.optionLabel}>
                            {q.type === "true_false" ? "" : `${OPTION_LABELS[oi]})`}
                          </span>
                          <span className={s.optionText}>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Development: blank lines */}
                  {q.type === "development" && (
                    <div className="mt-4 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={s.devLines + " h-5"} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <span>Copiloto de Exámenes — generado con IA</span>
        <span>
          {meta.subject} · Tema {tema}
        </span>
        <span>Página 1 / 1</span>
      </footer>
    </div>
  );
}
