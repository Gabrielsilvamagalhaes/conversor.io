"use client";

import { type DragEvent, useRef, useState } from "react";

type Status = "idle" | "validating" | "accepted" | "rejected";

interface UploadResult {
  fileName?: string;
  sizeBytes?: number;
  message?: string;
  error?: string;
}

/** Área de upload de .csv: arraste-e-solte ou clique. Só valida (sem conversão). */
export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);

  async function upload(file: File): Promise<void> {
    setStatus("validating");
    setResult(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data: UploadResult = await res.json();
      if (res.ok) {
        setStatus("accepted");
        setResult(data);
      } else {
        setStatus("rejected");
        setResult(data);
      }
    } catch {
      setStatus("rejected");
      setResult({ error: "Erro de rede. Tente novamente." });
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <div className="w-full max-w-xl">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target wraps a real input/button */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging ? "border-sanguine bg-sanguine/5" : "border-line"
        }`}
      >
        <p className="font-display text-xl">Deposite seu códice</p>
        <p className="mt-2 text-sm text-muted">
          Arraste um arquivo <strong>.csv</strong> aqui, ou
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          Escolher arquivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          aria-label="Selecionar arquivo CSV"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <p className="mt-6 text-xs text-muted">
          Apenas .csv · máx. 10 MB · validamos a matéria antes de converter
        </p>
      </div>

      {status === "validating" ? <p className="mt-4 text-sm text-muted">Validando…</p> : null}
      {status === "accepted" && result ? (
        <div className="mt-4 rounded-lg border border-line bg-bg-elev p-4 text-sm">
          <p className="font-medium text-fg">✓ {result.fileName}</p>
          <p className="mt-1 text-muted">{result.message}</p>
        </div>
      ) : null}
      {status === "rejected" && result ? (
        <p className="mt-4 rounded-lg border border-sanguine/40 bg-sanguine/5 p-4 text-sm text-sanguine">
          {result.error}
        </p>
      ) : null}
    </div>
  );
}
