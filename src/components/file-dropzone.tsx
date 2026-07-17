"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type DragEvent, useRef, useState } from "react";
import { ConversionFlow } from "@/components/conversion-flow";
import { SpreadsheetPreview } from "@/components/spreadsheet-preview";

type Status = "idle" | "reading" | "ready" | "converting" | "done" | "error";

interface PreviewData {
  readonly fileName: string;
  readonly extension: "csv" | "xlsx";
  readonly target: "csv" | "xlsx";
  readonly sizeMb: number;
  readonly totalRows: number;
  readonly columns: number;
  readonly previewRows: string[][];
}

const ACCEPT = ".csv,.xlsx";

/** Upload de planilha (.csv/.xlsx): valida, pré-visualiza e converte para o par oposto. */
export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const reduceMotion = useReducedMotion();

  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    fileRef.current = null;
    setStatus("idle");
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function readPreview(file: File): Promise<void> {
    fileRef.current = file;
    setStatus("reading");
    setError(null);
    setPreview(null);

    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/preview", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível ler o arquivo.");
        setStatus("error");
        return;
      }
      setPreview(data as PreviewData);
      setStatus("ready");
    } catch {
      setError("Erro de rede. Tente novamente.");
      setStatus("error");
    }
  }

  async function convert(): Promise<void> {
    const file = fileRef.current;
    if (!file || !preview) return;
    setStatus("converting");
    setError(null);

    const body = new FormData();
    body.append("file", file);
    body.append("target", preview.target);
    try {
      const res = await fetch("/api/convert", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falha na conversão.");
        setStatus("error");
        return;
      }
      const blob = await res.blob();
      triggerDownload(blob, `${stripExtension(preview.fileName)}.${preview.target}`);
      setStatus("done");
    } catch {
      setError("Erro de rede durante a conversão.");
      setStatus("error");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void readPreview(file);
  }

  return (
    <div className="w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {status === "idle" || status === "reading" ? (
          <motion.div
            key="dropzone"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          >
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
              className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                dragging ? "border-sanguine bg-sanguine/5" : "border-line hover:border-muted"
              }`}
            >
              <p className="font-display text-2xl">Solte sua planilha aqui</p>
              <p className="mt-2 text-sm text-muted">
                Arraste um <strong>.csv</strong> ou <strong>.xlsx</strong>, ou
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-full bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Escolher arquivo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                aria-label="Selecionar planilha CSV ou XLSX"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readPreview(file);
                }}
              />
              <p className="mt-6 text-xs text-muted">
                csv ↔ xlsx · máx. 10 MB · validamos a matéria antes de converter
              </p>
              {status === "reading" ? (
                <motion.p
                  className="mt-5 text-sm text-gold"
                  animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
                >
                  Lendo o arquivo…
                </motion.p>
              ) : null}
            </div>
          </motion.div>
        ) : null}

        {status === "ready" && preview ? (
          <motion.div
            key="preview"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <SpreadsheetPreview
              fileName={preview.fileName}
              extension={preview.extension}
              target={preview.target}
              sizeMb={preview.sizeMb}
              totalRows={preview.totalRows}
              columns={preview.columns}
              rows={preview.previewRows}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void convert()}
                className="rounded-full bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Converter para .{preview.target}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-line px-6 py-2.5 text-sm font-medium hover:bg-bg-elev"
              >
                Trocar arquivo
              </button>
            </div>
          </motion.div>
        ) : null}

        {status === "converting" && preview ? (
          <motion.div
            key="converting"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          >
            <ConversionFlow from={preview.extension} to={preview.target} />
          </motion.div>
        ) : null}

        {status === "done" && preview ? (
          <motion.div
            key="done"
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-gold/40 bg-bg-elev p-8 text-center"
          >
            <p className="font-display text-2xl text-gold">Transmutação concluída</p>
            <p className="mt-2 text-sm text-muted">
              O download de <strong>.{preview.target}</strong> começou automaticamente.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              Converter outro
            </button>
          </motion.div>
        ) : null}

        {status === "error" ? (
          <motion.div
            key="error"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-sanguine/40 bg-sanguine/5 p-6 text-center"
          >
            <p className="text-sm text-sanguine">{error}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-full border border-line px-5 py-2 text-sm font-medium hover:bg-bg-elev"
            >
              Tentar de novo
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
