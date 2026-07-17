import type { AcceptedExtension } from "./accepted-format";

/** Par de conversão (origem → destino). */
export interface ConversionPair {
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
}

/** Catálogo de pares suportados no MVP. Adicionar um par = adicionar um adapter. */
export const CONVERSION_PAIRS: readonly ConversionPair[] = [
  { from: "csv", to: "xlsx" },
  { from: "xlsx", to: "csv" },
] as const;

export function isSupportedPair(from: string, to: string): boolean {
  return CONVERSION_PAIRS.some((pair) => pair.from === from && pair.to === to);
}

/** Destino automático para uma extensão de origem (par único por origem no MVP). */
export function targetFor(from: string): AcceptedExtension | null {
  return CONVERSION_PAIRS.find((pair) => pair.from === from)?.to ?? null;
}
