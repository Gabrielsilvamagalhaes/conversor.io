"use client";

import { useEffect, useState } from "react";
import { parseCsvPreview } from "@/components/dropzone/parse-csv-preview";
import { parseJsonPreview } from "@/components/dropzone/parse-json-preview";
import { resolveResultPreviewKind } from "@/components/dropzone/preview-kind";
import type { ConversionResult } from "@/components/dropzone/use-conversion";
import { FileInfoCard } from "@/components/file-info-card";
import { JsonPreview } from "@/components/json-preview";
import { PdfPreview } from "@/components/pdf-preview";
import { SpreadsheetPreview } from "@/components/spreadsheet-preview";
import { MAX_RESULT_TEXT_SAMPLE } from "@/shared/constants/upload";
import { formatBytes } from "@/shared/utils/format-bytes";
import { formatDuration } from "@/shared/utils/format-duration";

interface ResultPanelProps {
  readonly result: ConversionResult;
  readonly onDownload: () => void;
  readonly onReset: () => void;
}

/** MB (2 casas) — adaptador para os cards de prévia legados, que esperam `sizeMb: number`. */
function bytesToMb(bytes: number): number {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

/**
 * Painel de resultado: mostra o que saiu da conversão (prévia conforme a extensão de
 * destino, metadados) antes do usuário decidir baixar. O download deixou de ser automático —
 * é uma ação explícita ("Baixar"); "Converter outro" reinicia o fluxo do zero.
 */
export function ResultPanel({ result, onDownload, onReset }: ResultPanelProps) {
  const kind = resolveResultPreviewKind(result.toExtension);
  const isDocxToPdf = result.fromExtension === "docx" && result.toExtension === "pdf";

  return (
    <div className="space-y-5">
      <p className="text-center font-display text-2xl text-gold">Transmutação concluída</p>
      <p className="-mt-3 text-center text-sm text-muted">
        Confira o resultado abaixo antes de baixar.
      </p>

      <ResultPreview result={result} kind={kind} />

      {isDocxToPdf ? (
        <p className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-muted">
          Layout simplificado — texto, títulos, listas e tabelas são preservados; fontes e
          posicionamento originais não.
        </p>
      ) : null}

      <dl className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Tamanho" value={formatBytes(result.sizeBytes)} />
        <Stat label="Tempo" value={formatDuration(result.tookMs)} />
        <Stat label="Conversão" value={`.${result.fromExtension} → .${result.toExtension}`} />
      </dl>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          aria-label={`Baixar ${result.fileName}`}
          className="rounded-full bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Baixar
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-line px-6 py-2.5 text-sm font-medium hover:bg-bg-elev"
        >
          Converter outro
        </button>
      </div>
    </div>
  );
}

function ResultPreview({
  result,
  kind,
}: {
  result: ConversionResult;
  kind: ReturnType<typeof resolveResultPreviewKind>;
}) {
  switch (kind) {
    case "text":
      return <TextResultPreview result={result} />;
    case "spreadsheet":
      return <SpreadsheetResultPreview result={result} />;
    case "json":
      return <JsonResultPreview result={result} />;
    case "pdf":
      return (
        <PdfPreview
          file={result.blob}
          fileName={result.fileName}
          sizeMb={bytesToMb(result.sizeBytes)}
          target={result.toExtension}
        />
      );
    case "audio":
      return <AudioResultPreview result={result} />;
    case "xlsx":
      return (
        <div className="space-y-3">
          <FileInfoCard
            fileName={result.fileName}
            extension={result.fromExtension}
            target={result.toExtension}
            sizeMb={bytesToMb(result.sizeBytes)}
          />
          <p className="text-center text-xs text-muted">
            Prévia de .xlsx gerado não disponível — baixe para conferir.
          </p>
        </div>
      );
    default:
      return (
        <FileInfoCard
          fileName={result.fileName}
          extension={result.fromExtension}
          target={result.toExtension}
          sizeMb={bytesToMb(result.sizeBytes)}
        />
      );
  }
}

function ResultHeader({ result }: { result: ConversionResult }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="truncate font-medium text-fg" title={result.fileName}>
        {result.fileName}
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
        <span className="uppercase">{result.fromExtension}</span>
        <span className="text-sanguine">→</span>
        <span className="uppercase">{result.toExtension}</span>
      </span>
    </div>
  );
}

function LoadingCard({ fileName }: { fileName: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <p className="truncate font-medium text-fg" title={fileName}>
        {fileName}
      </p>
      <div className="mt-5 h-40 animate-pulse rounded-lg border border-line bg-bg motion-reduce:animate-none" />
    </div>
  );
}

/** Prévia de saída `.txt`: amostra dos primeiros ~2000 caracteres em bloco monoespaçado. */
function TextResultPreview({ result }: { result: ConversionResult }) {
  const [sample, setSample] = useState<{ text: string; truncated: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    result.blob.text().then((text) => {
      if (cancelled) return;
      const truncated = text.length > MAX_RESULT_TEXT_SAMPLE;
      setSample({ text: truncated ? text.slice(0, MAX_RESULT_TEXT_SAMPLE) : text, truncated });
    });
    return () => {
      cancelled = true;
    };
  }, [result.blob]);

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <ResultHeader result={result} />
      {sample ? (
        <div className="mt-5 max-h-72 overflow-auto rounded-lg border border-line bg-bg p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-muted">
            {sample.text}
            {sample.truncated ? "\n…" : ""}
          </pre>
        </div>
      ) : (
        <div className="mt-5 h-40 animate-pulse rounded-lg border border-line bg-bg motion-reduce:animate-none" />
      )}
    </div>
  );
}

/** Prévia de saída `.csv`: parse client-side (papaparse) reaproveitando `SpreadsheetPreview`. */
function SpreadsheetResultPreview({ result }: { result: ConversionResult }) {
  const [data, setData] = useState<ReturnType<typeof parseCsvPreview> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    result.blob
      .text()
      .then((text) => {
        if (cancelled) return;
        setData(parseCsvPreview(text));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [result.blob]);

  if (failed) {
    return (
      <FileInfoCard
        fileName={result.fileName}
        extension={result.fromExtension}
        target={result.toExtension}
        sizeMb={bytesToMb(result.sizeBytes)}
      />
    );
  }

  if (!data) return <LoadingCard fileName={result.fileName} />;

  return (
    <SpreadsheetPreview
      fileName={result.fileName}
      extension={result.fromExtension}
      target={result.toExtension}
      sizeMb={bytesToMb(result.sizeBytes)}
      totalRows={data.totalRows}
      columns={data.columns}
      rows={data.previewRows}
    />
  );
}

/** Prévia de saída `.json`: `JSON.parse` client-side reaproveitando `JsonPreview`. */
function JsonResultPreview({ result }: { result: ConversionResult }) {
  const [data, setData] = useState<ReturnType<typeof parseJsonPreview> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    result.blob
      .text()
      .then((text) => {
        if (cancelled) return;
        setData(parseJsonPreview(text));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [result.blob]);

  if (failed) {
    return (
      <FileInfoCard
        fileName={result.fileName}
        extension={result.fromExtension}
        target={result.toExtension}
        sizeMb={bytesToMb(result.sizeBytes)}
      />
    );
  }

  if (!data) return <LoadingCard fileName={result.fileName} />;

  return (
    <JsonPreview
      fileName={result.fileName}
      target={result.toExtension}
      sizeMb={bytesToMb(result.sizeBytes)}
      rootKind={data.rootKind}
      itemCount={data.itemCount}
      depth={data.depth}
      sample={data.sample}
      truncated={data.truncated}
    />
  );
}

/** Prévia de saída `.mp3`/`.wav`: player nativo sobre o object URL do Blob resultante. */
function AudioResultPreview({ result }: { result: ConversionResult }) {
  const [url, setUrl] = useState<string | null>(null);

  // Object URL só existe enquanto este componente está montado (status "done"); ao trocar
  // de resultado ou desmontar (trocar arquivo, converter outro, unmount), é revogado aqui.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(result.blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [result.blob]);

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <ResultHeader result={result} />
      <div className="mt-5">
        {url ? (
          // biome-ignore lint/a11y/useMediaCaption: áudio gerado localmente a partir do próprio upload, sem legendas
          <audio controls src={url} className="w-full" />
        ) : (
          <div className="h-12 animate-pulse rounded-lg border border-line bg-bg motion-reduce:animate-none" />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 truncate font-display text-lg text-fg" title={value}>
        {value}
      </dd>
    </div>
  );
}
