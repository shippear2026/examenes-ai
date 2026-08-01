"use client";

import { useRef, useState, useCallback } from "react";

interface DropZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function DropZone({ file, onFileChange }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.type === "application/pdf") {
        onFileChange(dropped);
      }
    },
    [onFileChange]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileChange(selected);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Subir archivo PDF"
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        borderColor: isDragging
          ? "var(--accent-bright)"
          : file
          ? "var(--success)"
          : "var(--border-bright)",
        backgroundColor: isDragging
          ? "var(--accent-glow)"
          : file
          ? "rgba(34,197,94,0.06)"
          : "var(--surface-raised)",
        boxShadow: isDragging
          ? "0 0 0 3px var(--accent-glow), inset 0 0 40px var(--accent-glow)"
          : file
          ? "0 0 0 1px rgba(34,197,94,0.2)"
          : "none",
      }}
      className="relative w-full rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright min-h-[160px] flex flex-col items-center justify-center gap-3 select-none"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {file ? (
        <>
          {/* PDF icon */}
          <div
            className="flex items-center justify-center w-12 h-12 rounded-lg"
            style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2V8H20"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-success truncate max-w-xs">
              {file.name}
            </p>
            <p className="text-sm text-muted mt-0.5">{formatSize(file.size)}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileChange(null);
            }}
            className="mt-1 text-xs text-muted hover:text-foreground transition-colors underline underline-offset-2 cursor-pointer"
          >
            Cambiar archivo
          </button>
        </>
      ) : (
        <>
          {/* Upload icon */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: isDragging
                ? "var(--accent-glow)"
                : "var(--surface)",
              border: "1.5px solid var(--border-bright)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: isDragging ? "var(--accent-bright)" : "var(--muted)" }}
            >
              <path
                d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-center">
            <p
              className="font-semibold text-base transition-colors"
              style={{ color: isDragging ? "var(--accent-bright)" : "var(--foreground)" }}
            >
              {isDragging ? "Soltá el PDF aquí" : "Arrastrá tu bibliografía en PDF"}
            </p>
            <p className="text-sm text-muted mt-1">
              o{" "}
              <span
                className="underline underline-offset-2 cursor-pointer transition-colors"
                style={{ color: "var(--accent-bright)" }}
              >
                hacé clic para seleccionar
              </span>
            </p>
          </div>
          <p className="text-xs text-muted">Solo archivos .pdf · Máx 50 MB</p>
        </>
      )}
    </div>
  );
}
