"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type DragEvent, useMemo, useRef, useState } from "react";
import type { ConversionCatalogDto } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { CategoryTabs } from "@/components/category-tabs";
import { ConversionFlow } from "@/components/conversion-flow";
import { FileInfoCard } from "@/components/file-info-card";
import { JsonPreview } from "@/components/json-preview";
import { PdfPreview } from "@/components/pdf-preview";
import { SpreadsheetPreview } from "@/components/spreadsheet-preview";
import { Input } from "@/components/ui/input";

type Status = "idle" | "reading" | "ready" | "converting" | "done" | "error";

interface PreviewData {
  readonly fileName: string;
  readonly extension: string;
  readonly targets: string[];
  readonly sizeMb: number;
  readonly totalRows: number | null;
  readonly columns: number | null;
  readonly previewRows: string[][] | null;
  readonly pageCount: number | null;
  readonly pdfText: string | null;
  readonly jsonRootKind: "array" | "object" | "primitive" | null;
  readonly jsonItemCount: number | null;
  readonly jsonDepth: number | null;
  readonly jsonSample: string | null;
  readonly jsonTruncated: boolean | null;
}

interface FileDropzoneProps {
  readonly catalog: ConversionCatalogDto;
}

/** Upload dirigido por catálogo: escolhe categoria, valida, pré-visualiza e converte. */
export function FileDropzone({ catalog }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const reduceMotion = useReducedMotion();

  const [activeCategory, setActiveCategory] = useState<string>(catalog.categories[0].id);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const category = useMemo(
    () => catalog.categories.find((c) => c.id === activeCategory) ?? catalog.categories[0],
    [catalog, activeCategory],
  );
  const accept = category.extensions.map((ext) => `.${ext}`).join(",");
  const livePairs = category.pairs.filter((pair) => pair.live);
  const comingSoon = category.pairs.filter((pair) => !pair.live);

  // Opções de destino para o arquivo já enviado (dentro da categoria ativa).
  const targetOptions = preview
    ? category.pairs.filter((pair) => pair.from === preview.extension)
    : [];

  function reset(): void {
    fileRef.current = null;
    setStatus("idle");
    setPreview(null);
    setTarget(null);
    setOutputName("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectCategory(id: string): void {
    setActiveCategory(id);
    reset();
  }

  async function readPreview(file: File): Promise<void> {
    fileRef.current = file;
    setStatus("reading");
    setError(null);
    setPreview(null);
    setTarget(null);

    const body = new FormData();
    body.append("file", file);
    body.append("category", activeCategory);
    try {
      const res = await fetch("/api/preview", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível ler o arquivo.");
        setStatus("error");
        return;
      }
      const parsed = data as PreviewData;
      setPreview(parsed);
      setTarget(parsed.targets[0] ?? null);
      setOutputName(stripExtension(parsed.fileName));
      setStatus("ready");
    } catch {
      setError("Erro de rede. Tente novamente.");
      setStatus("error");
    }
  }

  async function convert(): Promise<void> {
    const file = fileRef.current;
    if (!file || !preview || !target) return;
    setStatus("converting");
    setError(null);

    const safeBase = sanitizeBaseName(outputName) || stripExtension(preview.fileName);
    const body = new FormData();
    body.append("file", file);
    body.append("target", target);
    body.append("outputName", safeBase);
    try {
      const res = await fetch("/api/convert", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falha na conversão.");
        setStatus("error");
        return;
      }
      const blob = await res.blob();
      triggerDownload(blob, `${safeBase}.${target}`);
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
      <div className="mb-6 flex justify-center">
        <CategoryTabs
          categories={catalog.categories}
          active={activeCategory}
          onSelect={selectCategory}
        />
      </div>

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
              <p className="font-display text-2xl">Solte seu arquivo aqui</p>
              <p className="mt-2 text-sm text-muted">
                Formatos de <strong>{category.label}</strong>, ou
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
                accept={accept}
                aria-label={`Selecionar arquivo de ${category.label}`}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readPreview(file);
                }}
              />
              <p className="mt-6 text-xs text-muted">
                {livePairs.map((p) => `${p.from} → ${p.to}`).join(" · ")}
                {comingSoon.length > 0
                  ? ` · em breve: ${comingSoon.map((p) => `${p.from} → ${p.to}`).join(", ")}`
                  : ""}{" "}
                · máx. 10 MB
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
            {preview.previewRows ? (
              <SpreadsheetPreview
                fileName={preview.fileName}
                extension={preview.extension as "csv" | "xlsx"}
                target={(target ?? preview.extension) as "csv" | "xlsx"}
                sizeMb={preview.sizeMb}
                totalRows={preview.totalRows ?? 0}
                columns={preview.columns ?? 0}
                rows={preview.previewRows}
              />
            ) : preview.extension === "pdf" && fileRef.current ? (
              <PdfPreview
                file={fileRef.current}
                fileName={preview.fileName}
                sizeMb={preview.sizeMb}
                pageCount={preview.pageCount ?? 0}
                textSample={preview.pdfText ?? ""}
                target={target ?? "—"}
              />
            ) : preview.extension === "json" && preview.jsonSample !== null ? (
              <JsonPreview
                fileName={preview.fileName}
                target={target ?? "—"}
                sizeMb={preview.sizeMb}
                rootKind={preview.jsonRootKind ?? "primitive"}
                itemCount={preview.jsonItemCount}
                depth={preview.jsonDepth ?? 1}
                sample={preview.jsonSample}
                truncated={preview.jsonTruncated ?? false}
              />
            ) : (
              <FileInfoCard
                fileName={preview.fileName}
                extension={preview.extension}
                target={target ?? "—"}
                sizeMb={preview.sizeMb}
              />
            )}

            <div className="space-y-1.5">
              <label htmlFor="output-name" className="text-xs uppercase tracking-wide text-muted">
                Nome do arquivo
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="output-name"
                  value={outputName}
                  onChange={(e) => setOutputName(sanitizeBaseName(e.target.value))}
                  placeholder="nome-do-arquivo"
                  aria-label="Nome do arquivo de saída"
                  className="h-10"
                />
                <span className="shrink-0 text-sm text-muted">.{target ?? "—"}</span>
              </div>
            </div>

            {targetOptions.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {targetOptions.map((option) =>
                  option.live ? (
                    <button
                      key={option.to}
                      type="button"
                      onClick={() => setTarget(option.to)}
                      aria-pressed={target === option.to}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        target === option.to
                          ? "border-sanguine bg-sanguine/10 text-fg"
                          : "border-line text-muted hover:text-fg"
                      }`}
                    >
                      .{option.to}
                    </button>
                  ) : (
                    <span
                      key={option.to}
                      className="cursor-not-allowed rounded-full border border-dashed border-line px-4 py-1.5 text-sm text-muted/60"
                      title="Em breve"
                    >
                      .{option.to} · em breve
                    </span>
                  ),
                )}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void convert()}
                disabled={!target}
                className="rounded-full bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {target ? `Converter para .${target}` : "Conversão indisponível"}
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
            <ConversionFlow from={preview.extension} to={target ?? ""} />
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
              O download de <strong>.{target}</strong> começou automaticamente.
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

/** Sanitização client do nome-base (espelha FileName.sanitizeBase no servidor). */
function sanitizeBaseName(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? "";
  return base
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "");
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
