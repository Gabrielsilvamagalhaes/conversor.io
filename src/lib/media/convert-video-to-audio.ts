"use client";

import { fetchFile } from "@ffmpeg/util";
import type { AudioExtension } from "@/domain/conversion/value-objects/accepted-format";
import { MediaError } from "@/shared/media/media-error";
import { getFFmpeg, terminateFFmpeg } from "./ffmpeg-client";

/** Args do ffmpeg por formato de áudio de destino. `-vn` descarta o vídeo. */
const AUDIO_ARGS: Record<AudioExtension, readonly string[]> = {
  mp3: ["-vn", "-acodec", "libmp3lame", "-q:a", "2"],
  wav: ["-vn", "-acodec", "pcm_s16le"],
};

const AUDIO_MIME: Record<AudioExtension, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

export interface ConvertVideoOptions {
  /** Progresso real do ffmpeg, 0–1. */
  readonly onProgress?: (ratio: number) => void;
  /** Cancela a conversão em andamento (encerra o worker). */
  readonly signal?: AbortSignal;
  /** Tempo máximo, em ms. Estourado, encerra e lança `MediaError("timeout")`. */
  readonly timeoutMs?: number;
}

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "mp4";
}

/**
 * Converte um vídeo em áudio inteiramente no navegador (ffmpeg.wasm).
 * Retorna o `Blob` de áudio pronto para download. Falhas viram `MediaError` tipado.
 */
export async function convertVideoToAudio(
  file: File,
  target: AudioExtension,
  options: ConvertVideoOptions = {},
): Promise<Blob> {
  const { onProgress, signal, timeoutMs } = options;

  if (signal?.aborted) throw new MediaError("cancelled");

  const ffmpeg = await getFFmpeg();

  const inputName = `input.${extensionOf(file.name)}`;
  const outputName = `output.${target}`;

  const onProgressHandler = ({ progress }: { progress: number }) => {
    // ffmpeg reporta valores levemente fora de [0,1]; normaliza para a barra.
    onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on("progress", onProgressHandler);

  let cancelled = false;
  let timedOut = false;
  const onAbort = () => {
    cancelled = true;
    terminateFFmpeg(); // encerra o worker; o exec pendente rejeita
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const timer =
    timeoutMs !== undefined
      ? setTimeout(() => {
          timedOut = true;
          terminateFFmpeg();
        }, timeoutMs)
      : null;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const code = await ffmpeg.exec(["-i", inputName, ...AUDIO_ARGS[target], outputName]);
    if (code !== 0) {
      throw new MediaError("unsupported_codec", `ffmpeg encerrou com código ${code}`);
    }

    const data = await ffmpeg.readFile(outputName);
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return new Blob([bytes as BlobPart], { type: AUDIO_MIME[target] });
  } catch (error) {
    if (timedOut) throw new MediaError("timeout");
    if (cancelled) throw new MediaError("cancelled");
    if (error instanceof MediaError) throw error;
    throw new MediaError("unsupported_codec");
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
    if (!cancelled && !timedOut) {
      ffmpeg.off("progress", onProgressHandler);
      // Limpa o FS virtual; ignora se o worker já foi encerrado (sem logger de servidor no
      // browser — o worker terminado já é um estado esperado aqui, nada a reportar).
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }
}
