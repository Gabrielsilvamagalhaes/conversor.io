"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CatalogCategoryDto } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { triggerDownload } from "@/components/dropzone/download";
import { sanitizeBaseName, stripExtension } from "@/components/dropzone/file-naming";
import { reportMediaConversion } from "@/components/dropzone/report-media-conversion";
import {
  type AudioExtension,
  isAudioExtension,
} from "@/domain/conversion/value-objects/accepted-format";
import { convertVideoToAudio } from "@/lib/media/convert-video-to-audio";
import { validateMedia } from "@/lib/media/validate-media";
import { isMediaError, MEDIA_ERROR_MESSAGES } from "@/shared/media/media-error";

export type Status = "idle" | "reading" | "ready" | "converting" | "done" | "error";

export interface PreviewData {
  readonly kind: "document" | "media";
  readonly fileName: string;
  readonly extension: string;
  readonly targets: string[];
  readonly sizeMb: number;
  /** Mídia: duração do vídeo e object URL da prévia (revogado no reset/unmount). */
  readonly durationSeconds: number | null;
  readonly videoUrl: string | null;
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

/** Resultado de uma conversão concluída: o Blob fica em memória até o usuário baixar. */
export interface ConversionResult {
  readonly blob: Blob;
  readonly fileName: string;
  readonly fromExtension: string;
  readonly toExtension: string;
  readonly sizeBytes: number;
  readonly tookMs: number;
}

export interface UseConversionArgs {
  readonly category: CatalogCategoryDto;
  readonly activeCategory: string;
}

/**
 * Máquina de estados do fluxo de conversão: leitura de prévia (`/api/preview` ou validação
 * de mídia no navegador), conversão (`/api/convert` ou ffmpeg.wasm) e resultado. Extraído de
 * `FileDropzone` para manter o componente de apresentação focado em entrada de arquivo e
 * seleção de categoria/destino/nome — aqui vivem rede, `AbortController` e o ciclo de vida
 * do object URL de mídia.
 */
export function useConversion({ category, activeCategory }: UseConversionArgs) {
  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaUrlRef = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);

  // Categoria de mídia: conversão roda no navegador (ffmpeg.wasm), não em /api/convert.
  const isMediaCategory = category.pairs.some((pair) => pair.engine === "client");

  function revokeMediaUrl(): void {
    if (mediaUrlRef.current) {
      URL.revokeObjectURL(mediaUrlRef.current);
      mediaUrlRef.current = null;
    }
  }

  // Aborta conversão em curso e libera o object URL do vídeo ao desmontar.
  // Usa os refs diretamente (estáveis) para o efeito rodar só no unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
    };
  }, []);

  function reset(): void {
    abortRef.current?.abort();
    abortRef.current = null;
    revokeMediaUrl();
    fileRef.current = null;
    setStatus("idle");
    setPreview(null);
    setTarget(null);
    setOutputName("");
    setError(null);
    setProgress(0);
    setResult(null);
  }

  async function readPreview(file: File): Promise<void> {
    fileRef.current = file;
    setStatus("reading");
    setError(null);
    setPreview(null);
    setTarget(null);
    setResult(null);
    revokeMediaUrl();

    if (isMediaCategory) {
      await readMediaPreview(file);
      return;
    }

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
      const parsed: PreviewData = {
        kind: "document",
        durationSeconds: null,
        videoUrl: null,
        ...(data as Omit<PreviewData, "kind" | "durationSeconds" | "videoUrl">),
      };
      setPreview(parsed);
      setTarget(parsed.targets[0] ?? null);
      setOutputName(stripExtension(parsed.fileName));
      setStatus("ready");
    } catch {
      setError("Erro de rede. Tente novamente.");
      setStatus("error");
    }
  }

  /** Prévia de vídeo 100% no navegador: valida, lê metadados e reutiliza o object URL. */
  async function readMediaPreview(file: File): Promise<void> {
    try {
      const media = await validateMedia(file);
      mediaUrlRef.current = media.objectUrl;
      const targets = category.pairs
        .filter((pair) => pair.live && pair.from === media.extension)
        .map((pair) => pair.to);
      const data: PreviewData = {
        kind: "media",
        fileName: file.name,
        extension: media.extension,
        targets,
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        durationSeconds: media.durationSeconds,
        videoUrl: media.objectUrl,
        totalRows: null,
        columns: null,
        previewRows: null,
        pageCount: null,
        pdfText: null,
        jsonRootKind: null,
        jsonItemCount: null,
        jsonDepth: null,
        jsonSample: null,
        jsonTruncated: null,
      };
      setPreview(data);
      setTarget(targets[0] ?? null);
      setOutputName(stripExtension(file.name));
      setStatus("ready");
    } catch (err) {
      const message = isMediaError(err) ? err.message : MEDIA_ERROR_MESSAGES.unknown;
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  }

  async function convert(): Promise<void> {
    const file = fileRef.current;
    if (!file || !preview || !target) return;
    setError(null);

    if (preview.kind === "media") {
      await convertMedia(file, preview, target);
      return;
    }

    setStatus("converting");

    const safeBase = sanitizeBaseName(outputName) || stripExtension(preview.fileName);
    const body = new FormData();
    body.append("file", file);
    body.append("target", target);
    body.append("outputName", safeBase);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/convert", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falha na conversão.");
        setStatus("error");
        return;
      }
      const blob = await res.blob();
      setResult({
        blob,
        fileName: `${safeBase}.${target}`,
        fromExtension: preview.extension,
        toExtension: target,
        sizeBytes: blob.size,
        tookMs: Date.now() - startedAt,
      });
      setStatus("done");
    } catch {
      setError("Erro de rede durante a conversão.");
      setStatus("error");
    }
  }

  /**
   * Converte vídeo → áudio no navegador com progresso real e cancelamento. Ao concluir,
   * reporta a conversão ao histórico (best-effort — nunca bloqueia nem falha visivelmente).
   */
  async function convertMedia(file: File, current: PreviewData, to: string): Promise<void> {
    if (!isAudioExtension(to)) {
      const message = MEDIA_ERROR_MESSAGES.unsupported_pair;
      setError(message);
      setStatus("error");
      toast.error(message);
      return;
    }

    setStatus("converting");
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const safeBase = sanitizeBaseName(outputName) || stripExtension(current.fileName);
    const startedAt = Date.now();

    try {
      const blob = await convertVideoToAudio(file, to as AudioExtension, {
        onProgress: setProgress,
        signal: controller.signal,
      });
      const tookMs = Date.now() - startedAt;
      setResult({
        blob,
        fileName: `${safeBase}.${to}`,
        fromExtension: current.extension,
        toExtension: to,
        sizeBytes: blob.size,
        tookMs,
      });
      setStatus("done");
      // Best-effort: conversão já concluiu com sucesso, o registro no histórico é secundário.
      void reportMediaConversion({
        fileName: current.fileName,
        from: current.extension,
        to,
        sizeBytes: file.size,
        outputSizeBytes: blob.size,
        durationMs: tookMs,
      });
    } catch (err) {
      if (isMediaError(err) && err.code === "cancelled") {
        toast(MEDIA_ERROR_MESSAGES.cancelled);
        setStatus("ready");
        return;
      }
      const message = isMediaError(err) ? err.message : MEDIA_ERROR_MESSAGES.unknown;
      setError(message);
      setStatus("error");
      toast.error(message);
    } finally {
      abortRef.current = null;
    }
  }

  function cancelConversion(): void {
    abortRef.current?.abort();
  }

  function download(): void {
    if (!result) return;
    triggerDownload(result.blob, result.fileName);
  }

  return {
    status,
    preview,
    target,
    setTarget,
    outputName,
    setOutputName,
    error,
    progress,
    result,
    fileRef,
    readPreview,
    convert,
    cancelConversion,
    reset,
    download,
  } as const;
}
