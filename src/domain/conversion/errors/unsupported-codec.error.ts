/** Conteúdo de mídia com codec/formato que o conversor não consegue processar. Mapear para HTTP 400. */
export class UnsupportedCodecError extends Error {
  constructor(readonly reason: string) {
    super(`Formato de mídia não suportado: ${reason}`);
    this.name = "UnsupportedCodecError";
  }
}
