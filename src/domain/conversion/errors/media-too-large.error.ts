/** Arquivo de mídia acima do limite de tamanho permitido. Mapear para HTTP 400. */
export class MediaTooLargeError extends Error {
  constructor(
    readonly actualBytes: number,
    readonly maxBytes: number,
  ) {
    const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0);
    super(`Arquivo de mídia muito grande: ${mb(actualBytes)} MB (máximo ${mb(maxBytes)} MB).`);
    this.name = "MediaTooLargeError";
  }
}
