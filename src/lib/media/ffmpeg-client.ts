"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { MediaError } from "@/shared/media/media-error";

/**
 * Carregador lazy do ffmpeg.wasm (single-thread, core self-hosted em `/public/ffmpeg`).
 *
 * O core (~32 MB) só é baixado quando o usuário realmente converte um vídeo — não entra no
 * first load da página. Single-thread dispensa headers COOP/COEP, então roda estável na Vercel.
 */
const CORE_BASE = "/ffmpeg";

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

async function load(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
  } catch {
    throw new MediaError("load_failed");
  }
  instance = ffmpeg;
  return ffmpeg;
}

/** Retorna a instância carregada do ffmpeg, reutilizando entre conversões. */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (instance?.loaded) return instance;
  if (!loading) {
    loading = load().catch((error) => {
      loading = null; // permite nova tentativa após falha de carregamento
      throw error;
    });
  }
  return loading;
}

/** Encerra o worker (usado ao cancelar). Força recarregar na próxima conversão. */
export function terminateFFmpeg(): void {
  instance?.terminate();
  instance = null;
  loading = null;
}
