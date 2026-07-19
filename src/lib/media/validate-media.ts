"use client";

import { isVideoExtension } from "@/domain/conversion/value-objects/accepted-format";
import { MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_BYTES } from "@/shared/constants/upload";
import { MediaError } from "@/shared/media/media-error";

export interface ValidatedMedia {
  readonly extension: string;
  readonly durationSeconds: number | null;
  /** Object URL do vídeo, reutilizado pela prévia. Quem chama deve revogar ao descartar. */
  readonly objectUrl: string;
}

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/** Lê a duração do vídeo via metadados, sem decodificar o arquivo inteiro. */
function readDuration(objectUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () =>
      reject(new MediaError("unsupported_codec", "não foi possível ler os metadados do vídeo"));
    video.src = objectUrl;
  });
}

/**
 * Valida um vídeo no cliente antes de converter: extensão, tamanho (≤ 100 MB) e duração
 * (≤ 15 min). O arquivo nunca sobe ao servidor. Retorna o object URL para a prévia reutilizar.
 */
export async function validateMedia(file: File): Promise<ValidatedMedia> {
  const extension = extensionOf(file.name);
  if (!isVideoExtension(extension)) {
    throw new MediaError("unsupported_pair", `.${extension} não é um vídeo suportado`);
  }
  if (file.size <= 0) {
    throw new MediaError("unsupported_codec", "arquivo vazio");
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new MediaError("too_large");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const duration = await readDuration(objectUrl);
    // Duração pode vir Infinity/NaN em alguns webm sem índice; nesse caso não bloqueia.
    if (Number.isFinite(duration) && duration > MAX_VIDEO_DURATION_SECONDS) {
      throw new MediaError("too_long");
    }
    return {
      extension,
      durationSeconds: Number.isFinite(duration) ? duration : null,
      objectUrl,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
