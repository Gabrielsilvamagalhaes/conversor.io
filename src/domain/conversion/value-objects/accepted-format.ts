/**
 * Extensões aceitas no catálogo.
 * Planilhas: `.csv`, `.xlsx` · Dados: `.json`, `.csv` · Documentos: `.pdf`, `.docx`, `.txt`.
 * Mídia: `.mp4`/`.webm`/`.mov` (origem, vídeo) → `.mp3`/`.wav` (destino, áudio).
 * `.txt` é apenas destino (saída de `pdf → txt`), nunca origem de upload.
 */
export const ACCEPTED_EXTENSIONS = [
  "csv",
  "xlsx",
  "json",
  "pdf",
  "docx",
  "txt",
  "mp4",
  "webm",
  "mov",
  "mp3",
  "wav",
] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export function isAcceptedExtension(extension: string): extension is AcceptedExtension {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
}

/** Extensões de vídeo aceitas como origem de conversão de mídia. */
export const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"] as const;
export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];

export function isVideoExtension(extension: string): extension is VideoExtension {
  return (VIDEO_EXTENSIONS as readonly string[]).includes(extension);
}

/** Extensões de áudio produzidas pela conversão de mídia. */
export const AUDIO_EXTENSIONS = ["mp3", "wav"] as const;
export type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];

export function isAudioExtension(extension: string): extension is AudioExtension {
  return (AUDIO_EXTENSIONS as readonly string[]).includes(extension);
}
