"use client";

export type TemplateId = "university" | "secondary" | "minimal";

interface Template {
  id: TemplateId;
  label: string;
  subtitle: string;
  preview: React.ReactNode;
}

interface TemplateSelectorProps {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

function UniversityPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-1 p-2">
      <div className="flex items-center gap-1.5">
        <div
          className="w-5 h-5 rounded-sm"
          style={{ backgroundColor: "var(--accent)" }}
        />
        <div
          className="h-1.5 rounded-full flex-1"
          style={{ backgroundColor: "var(--border-bright)" }}
        />
      </div>
      <div
        className="h-1 rounded-full w-3/4 mt-1"
        style={{ backgroundColor: "var(--border-bright)" }}
      />
      <div className="mt-2 space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-1.5 items-start">
            <div
              className="w-3 h-3 rounded-full mt-0.5 shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <div className="flex-1 space-y-0.5">
              <div
                className="h-1 rounded-full w-full"
                style={{ backgroundColor: "var(--border-bright)" }}
              />
              <div
                className="h-1 rounded-full w-4/5"
                style={{ backgroundColor: "var(--border)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecondaryPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-1 p-2">
      <div
        className="h-4 rounded-sm w-full"
        style={{ backgroundColor: "var(--accent)", opacity: 0.7 }}
      />
      <div
        className="h-1 rounded-full w-2/3 mt-1"
        style={{ backgroundColor: "var(--border-bright)" }}
      />
      <div className="mt-2 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-0.5">
            <div
              className="h-1.5 rounded-full w-full"
              style={{ backgroundColor: "var(--border-bright)" }}
            />
            <div className="flex gap-1.5 ml-2">
              {["A", "B", "C"].map((opt) => (
                <div
                  key={opt}
                  className="flex items-center gap-0.5"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--border-bright)" }}
                  />
                  <div
                    className="h-1 w-4 rounded-full"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      <div className="flex justify-between items-center">
        <div
          className="h-1.5 rounded-full w-1/3"
          style={{ backgroundColor: "var(--border-bright)" }}
        />
        <div
          className="h-1 rounded-full w-1/4"
          style={{ backgroundColor: "var(--border)" }}
        />
      </div>
      <div
        className="w-full h-px"
        style={{ backgroundColor: "var(--border-bright)" }}
      />
      <div className="space-y-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 rounded-full"
            style={{
              backgroundColor: "var(--border-bright)",
              width: `${70 + (i % 3) * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const templates: Template[] = [
  {
    id: "university",
    label: "Universitaria",
    subtitle: "Formal con logo y encabezado",
    preview: <UniversityPreview />,
  },
  {
    id: "secondary",
    label: "Secundaria",
    subtitle: "Clara, con opciones A/B/C",
    preview: <SecondaryPreview />,
  },
  {
    id: "minimal",
    label: "Minimalista",
    subtitle: "Limpia, sin distracciones",
    preview: <MinimalPreview />,
  },
];

export default function TemplateSelector({
  selected,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {templates.map((t) => {
        const isSelected = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="relative flex flex-col items-start rounded-xl border transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 cursor-pointer overflow-hidden group"
            style={{
              borderColor: isSelected ? "var(--accent-bright)" : "var(--border-bright)",
              backgroundColor: isSelected
                ? "var(--accent-glow)"
                : "var(--surface-raised)",
              boxShadow: isSelected
                ? "0 0 0 1px var(--accent-border), 0 4px 20px var(--accent-glow)"
                : "none",
            }}
            aria-pressed={isSelected}
          >
            {/* Thumbnail preview */}
            <div
              className="w-full h-20 overflow-hidden"
              style={{
                backgroundColor: "var(--surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {t.preview}
            </div>

            {/* Label */}
            <div className="px-3 py-2.5 w-full">
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-semibold transition-colors"
                  style={{
                    color: isSelected ? "var(--accent-bright)" : "var(--foreground)",
                  }}
                >
                  {t.label}
                </span>
                {isSelected && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {t.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
