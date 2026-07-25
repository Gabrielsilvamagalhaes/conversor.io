"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PdfPreviewProps {
  /** `File` de entrada ou `Blob` de um resultado de conversão — ambos expõem `arrayBuffer()`. */
  readonly file: Blob;
  readonly fileName: string;
  readonly sizeMb: number;
  /** Quando omitido (prévia de um resultado, sem leitura prévia no servidor), é derivado do próprio PDF. */
  readonly pageCount?: number | null;
  readonly textSample?: string;
  readonly target: string;
}

type RenderStatus = "rendering" | "image" | "text";

/** Prévia de PDF: renderiza a 1ª página no client (pdfjs-dist) com fallback de texto. */
export function PdfPreview({
  file,
  fileName,
  sizeMb,
  pageCount = null,
  textSample = "",
  target,
}: PdfPreviewProps) {
  const [status, setStatus] = useState<RenderStatus>("rendering");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resolvedPageCount, setResolvedPageCount] = useState<number | null>(pageCount);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const data = new Uint8Array(await file.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        if (pageCount === null && !cancelled) setResolvedPageCount(doc.numPages);
        const page = await doc.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1000 / base.width);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas indisponível.");

        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (cancelled) return;

        setImageUrl(canvas.toDataURL("image/png"));
        setStatus("image");
      } catch {
        if (!cancelled) setStatus("text");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, pageCount]);

  const pageCountLabel = resolvedPageCount ?? 0;
  const pageLabel = pageCountLabel === 1 ? "1 página" : `${pageCountLabel} páginas`;

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="truncate font-medium text-fg" title={fileName}>
          {fileName}
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <span className="uppercase">pdf</span>
            <span className="text-sanguine">→</span>
            <span className="uppercase">{target}</span>
          </span>
          <Dialog>
            <DialogTrigger
              aria-label="Expandir prévia"
              disabled={status === "rendering"}
              className="rounded-md border border-line p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-sanguine disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Maximize2 className="size-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="truncate pr-8" title={fileName}>
                {fileName}
              </DialogTitle>
              <p className="mt-1 mb-4 text-xs uppercase tracking-[0.18em] text-gold">{pageLabel}</p>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line bg-bg p-4">
                {status === "image" && imageUrl ? (
                  // biome-ignore lint/performance/noImgElement: dataURL local, sem otimização remota
                  <img
                    src={imageUrl}
                    alt={`Página 1 de ${fileName}`}
                    className="mx-auto w-full max-w-2xl"
                  />
                ) : (
                  <TextSample text={textSample} className="max-h-full" />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
        <Stat label="Tamanho" value={`${sizeMb} MB`} />
        <Stat label="Páginas" value={String(pageCountLabel)} />
      </dl>

      <div className="mt-5">
        {status === "rendering" ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-line bg-bg">
            <div className="h-40 w-32 animate-pulse rounded bg-line motion-reduce:animate-none" />
          </div>
        ) : null}

        {status === "image" && imageUrl ? (
          <div className="overflow-hidden rounded-lg border border-line bg-bg p-3">
            {/* biome-ignore lint/performance/noImgElement: dataURL local, sem otimização remota */}
            <img
              src={imageUrl}
              alt={`Página 1 de ${fileName}`}
              className="mx-auto max-h-80 w-auto"
            />
          </div>
        ) : null}

        {status === "text" ? (
          <div className="rounded-lg border border-line bg-bg p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-gold">
              Prévia de texto (não foi possível renderizar a página)
            </p>
            <TextSample text={textSample} className="max-h-64 overflow-auto" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TextSample({ text, className }: { text: string; className?: string }) {
  if (!text.trim()) {
    return <p className="text-sm text-muted">Sem texto extraível deste PDF.</p>;
  }
  return (
    <pre className={`whitespace-pre-wrap font-mono text-sm text-muted ${className ?? ""}`}>
      {text}
    </pre>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-display text-lg text-fg">{value}</dd>
    </div>
  );
}
