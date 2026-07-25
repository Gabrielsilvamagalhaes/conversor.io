/**
 * Qual prévia o painel de resultado renderiza, escolhida pela extensão de **saída**.
 * Pura (sem React) para ser testada isoladamente e reaproveitada pelo componente.
 */
export type ResultPreviewKind =
  | "text"
  | "spreadsheet"
  | "json"
  | "pdf"
  | "audio"
  | "xlsx"
  | "generic";

const AUDIO_EXTENSIONS = new Set(["mp3", "wav"]);

/** Resolve o tipo de prévia do resultado a partir da extensão de destino (case-insensitive). */
export function resolveResultPreviewKind(extension: string): ResultPreviewKind {
  const ext = extension.trim().toLowerCase();

  if (ext === "txt") return "text";
  if (ext === "csv") return "spreadsheet";
  if (ext === "json") return "json";
  if (ext === "pdf") return "pdf";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (ext === "xlsx") return "xlsx";
  return "generic";
}
