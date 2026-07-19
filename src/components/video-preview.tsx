"use client";

import { useRef } from "react";
import { VIDEO_PREVIEW_SECONDS } from "@/shared/constants/upload";

interface VideoPreviewProps {
  /** Object URL do vídeo (criado pelo caller; revogado por ele ao descartar). */
  readonly src: string;
  readonly fileName: string;
  readonly extension: string;
  readonly target: string;
  readonly sizeMb: number;
  readonly durationSeconds: number | null;
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Prévia de vídeo: player nativo limitado aos primeiros 30s (pausa ao atingir o limite).
 * O vídeo permanece no navegador — não sobe ao servidor.
 */
export function VideoPreview({
  src,
  fileName,
  extension,
  target,
  sizeMb,
  durationSeconds,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const capsPreview = durationSeconds !== null && durationSeconds > VIDEO_PREVIEW_SECONDS;

  function onTimeUpdate(): void {
    const video = videoRef.current;
    if (video && video.currentTime >= VIDEO_PREVIEW_SECONDS) {
      video.pause();
      video.currentTime = VIDEO_PREVIEW_SECONDS;
    }
  }

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

      <div className="relative mt-5 overflow-hidden rounded-xl border border-line bg-bg">
        {/* biome-ignore lint/a11y/useMediaCaption: prévia local do próprio upload, sem legendas */}
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          className="max-h-72 w-full bg-black"
        />
        {capsPreview ? (
          <span className="absolute right-2 top-2 rounded-full bg-bg-elev/90 px-2.5 py-1 text-xs text-gold shadow-sm">
            Prévia: primeiros {VIDEO_PREVIEW_SECONDS}s
          </span>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Tamanho</dt>
          <dd className="mt-1 font-display text-lg text-fg">{sizeMb} MB</dd>
        </div>
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Duração</dt>
          <dd className="mt-1 font-display text-lg text-fg">
            {durationSeconds !== null ? formatDuration(durationSeconds) : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Destino</dt>
          <dd className="mt-1 font-display text-lg text-fg uppercase">{target}</dd>
        </div>
      </dl>
    </div>
  );
}
