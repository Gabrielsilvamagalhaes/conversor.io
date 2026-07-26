import type { AcceptedExtension } from "./accepted-format";

/** Categoria de conversão exibida na UI (aba). */
export type ConversionCategory = "spreadsheets" | "data" | "documents" | "images" | "media";

/**
 * Onde a conversão executa:
 * - `server`: adapter no servidor via `POST /api/convert` (documentos/dados).
 * - `client`: conversão no navegador (ffmpeg.wasm). Vídeo não sobe ao servidor — contorna
 *   os limites de body/timeout da Vercel. A execução vive na presentation, não no DI.
 */
export type ConversionEngine = "server" | "client";

/**
 * Par de conversão (origem → destino) dentro de uma categoria.
 * `live: false` = conversão anunciada mas ainda sem adapter ("em breve").
 */
export interface ConversionPair {
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  readonly category: ConversionCategory;
  readonly live: boolean;
  readonly engine: ConversionEngine;
}

/**
 * Catálogo de pares. Par `server` ativo = adapter + registro no DI + `live: true`.
 * Par `client` ativo = tratado no navegador (ffmpeg.wasm), sem adapter no DI.
 * Pares `live: false` aparecem na UI como "em breve" e são rejeitados no convert.
 */
export const CONVERSION_PAIRS: readonly ConversionPair[] = [
  { from: "csv", to: "xlsx", category: "spreadsheets", live: true, engine: "server" },
  { from: "xlsx", to: "csv", category: "spreadsheets", live: true, engine: "server" },
  { from: "csv", to: "json", category: "data", live: true, engine: "server" },
  { from: "json", to: "csv", category: "data", live: true, engine: "server" },
  { from: "xlsx", to: "json", category: "data", live: true, engine: "server" },
  { from: "pdf", to: "txt", category: "documents", live: true, engine: "server" },
  { from: "docx", to: "pdf", category: "documents", live: true, engine: "server" },
  { from: "md", to: "pdf", category: "documents", live: true, engine: "server" },
  { from: "pdf", to: "docx", category: "documents", live: false, engine: "server" },
  { from: "png", to: "jpg", category: "images", live: true, engine: "server" },
  { from: "jpg", to: "png", category: "images", live: true, engine: "server" },
  { from: "webp", to: "png", category: "images", live: true, engine: "server" },
  { from: "webp", to: "jpg", category: "images", live: true, engine: "server" },
  { from: "png", to: "webp", category: "images", live: true, engine: "server" },
  { from: "jpg", to: "webp", category: "images", live: true, engine: "server" },
  { from: "mp4", to: "mp3", category: "media", live: true, engine: "client" },
  { from: "mp4", to: "wav", category: "media", live: true, engine: "client" },
  { from: "webm", to: "mp3", category: "media", live: true, engine: "client" },
  { from: "webm", to: "wav", category: "media", live: true, engine: "client" },
  { from: "mov", to: "mp3", category: "media", live: true, engine: "client" },
  { from: "mov", to: "wav", category: "media", live: true, engine: "client" },
] as const;

/**
 * Um par é convertível **no servidor** quando existe no catálogo, está `live` e usa engine `server`.
 * Pares de engine `client` (mídia/ffmpeg.wasm) nunca são convertidos pela rota de servidor.
 */
export function isSupportedPair(from: string, to: string): boolean {
  return CONVERSION_PAIRS.some(
    (pair) => pair.live && pair.engine === "server" && pair.from === from && pair.to === to,
  );
}

/** Um par é convertível **no cliente** (ffmpeg.wasm) quando está `live` e usa engine `client`. */
export function isClientConvertiblePair(from: string, to: string): boolean {
  return CONVERSION_PAIRS.some(
    (pair) => pair.live && pair.engine === "client" && pair.from === from && pair.to === to,
  );
}

/**
 * Destinos ativos para uma origem dentro de uma categoria. A categoria desambigua
 * origens multi-alvo (ex.: `csv` → `xlsx` em Planilhas, `csv` → `json` em Dados).
 */
export function liveTargetsFor(from: string, category: ConversionCategory): AcceptedExtension[] {
  return CONVERSION_PAIRS.filter(
    (pair) => pair.live && pair.from === from && pair.category === category,
  ).map((pair) => pair.to);
}

/** Todos os pares de uma categoria, incluindo os "em breve" (para a UI). */
export function pairsForCategory(category: ConversionCategory): ConversionPair[] {
  return CONVERSION_PAIRS.filter((pair) => pair.category === category);
}
