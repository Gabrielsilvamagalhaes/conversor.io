"use client";

import { useState } from "react";

interface ImagePreviewProps {
  /** Object URL da imagem (criado pelo caller; revogado por ele ao descartar). */
  readonly src: string;
  readonly fileName: string;
  readonly extension: string;
  readonly target: string;
  readonly sizeMb: number;
  /** Tamanho antes da redução no navegador, quando houve redução. */
  readonly originalSizeMb: number | null;
}

/**
 * Prévia da imagem enviada: os pixels vêm de um object URL local, não do servidor — imagem não
 * tem reader de amostra em `/api/preview`, que só valida o arquivo e devolve os destinos.
 * As dimensões são lidas do próprio `<img>` depois da decodificação.
 */
export function ImagePreview({
  src,
  fileName,
  extension,
  target,
  sizeMb,
  originalSizeMb,
}: ImagePreviewProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="truncate font-medium text-fg" title={fileName}>
          {fileName}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <span className="uppercase">{extension}</span>
          <span className="text-sanguine">→</span>
          <span className="uppercase">{target}</span>
        </span>
      </div>

      <div className="mt-5 flex justify-center overflow-hidden rounded-xl border border-line bg-bg p-3">
        {/* biome-ignore lint/performance/noImgElement: object URL local, fora do otimizador do Next */}
        <img
          src={src}
          alt={`Prévia de ${fileName}`}
          onLoad={(event) =>
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          className="max-h-72 w-auto object-contain"
        />
      </div>

      {originalSizeMb !== null ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-muted">
          A imagem tinha {originalSizeMb} MB e foi reduzida para {sizeMb} MB no seu navegador para
          caber no limite de upload. A conversão usa a versão reduzida.
        </p>
      ) : null}

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Tamanho</dt>
          <dd className="mt-1 font-display text-lg text-fg">{sizeMb} MB</dd>
        </div>
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Dimensões</dt>
          <dd className="mt-1 font-display text-lg text-fg">
            {dimensions ? `${dimensions.width}×${dimensions.height}` : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Destino</dt>
          <dd className="mt-1 font-display text-lg uppercase text-fg">{target}</dd>
        </div>
      </dl>
    </div>
  );
}
