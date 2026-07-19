import type { AcceptedExtension } from "./accepted-format";

/** Categoria de conversão exibida na UI (aba). */
export type ConversionCategory = "spreadsheets" | "data" | "documents";

/**
 * Par de conversão (origem → destino) dentro de uma categoria.
 * `live: false` = conversão anunciada mas ainda sem adapter ("em breve").
 */
export interface ConversionPair {
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  readonly category: ConversionCategory;
  readonly live: boolean;
}

/**
 * Catálogo de pares. Adicionar um par ativo = adicionar um adapter + registrar no DI + `live: true`.
 * Pares `live: false` aparecem na UI como "em breve" e são rejeitados no convert.
 */
export const CONVERSION_PAIRS: readonly ConversionPair[] = [
  { from: "csv", to: "xlsx", category: "spreadsheets", live: true },
  { from: "xlsx", to: "csv", category: "spreadsheets", live: true },
  { from: "csv", to: "json", category: "data", live: true },
  { from: "json", to: "csv", category: "data", live: true },
  { from: "pdf", to: "txt", category: "documents", live: true },
  { from: "docx", to: "pdf", category: "documents", live: false },
  { from: "pdf", to: "docx", category: "documents", live: false },
] as const;

/** Um par só é suportado (convertível) quando existe no catálogo E está `live`. */
export function isSupportedPair(from: string, to: string): boolean {
  return CONVERSION_PAIRS.some((pair) => pair.live && pair.from === from && pair.to === to);
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
