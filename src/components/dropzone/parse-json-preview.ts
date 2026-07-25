import { MAX_JSON_SAMPLE } from "@/shared/constants/upload";

export interface JsonPreviewData {
  readonly rootKind: "array" | "object" | "primitive";
  readonly itemCount: number | null;
  readonly depth: number;
  readonly sample: string;
  readonly truncated: boolean;
}

/**
 * Parse client-side de um JSON de saída (resultado de conversão) para a prévia do painel de
 * resultado. Espelha `JsonReader` (infra, server-side) — duplicado aqui de propósito: o
 * resultado nunca passa pelo servidor de novo, então a leitura tem que acontecer no
 * navegador com o mesmo formato de dados que `JsonPreview` já consome.
 * Lança se `text` não for um JSON válido — quem chama decide o fallback.
 */
export function parseJsonPreview(text: string): JsonPreviewData {
  const parsed: unknown = JSON.parse(text);

  const pretty = JSON.stringify(parsed, null, 2) ?? String(parsed);
  const truncated = pretty.length > MAX_JSON_SAMPLE;

  return {
    rootKind: rootKindOf(parsed),
    itemCount: itemCountOf(parsed),
    depth: depthOf(parsed),
    sample: truncated ? pretty.slice(0, MAX_JSON_SAMPLE) : pretty,
    truncated,
  };
}

function rootKindOf(value: unknown): JsonPreviewData["rootKind"] {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "object";
  return "primitive";
}

function itemCountOf(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value).length;
  return null;
}

/** Profundidade máxima de aninhamento; primitivo/vazio = 1. */
function depthOf(value: unknown): number {
  if (value === null || typeof value !== "object") return 1;
  const children = Array.isArray(value) ? value : Object.values(value);
  let max = 0;
  for (const child of children) {
    const d = depthOf(child);
    if (d > max) max = d;
  }
  return max + 1;
}
