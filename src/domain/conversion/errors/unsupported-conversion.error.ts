/** Par de conversão fora do catálogo suportado. HTTP 400. */
export class UnsupportedConversionError extends Error {
  constructor(from: string, to: string) {
    super(`Conversão não suportada: ${from} → ${to}`);
    this.name = "UnsupportedConversionError";
  }
}
