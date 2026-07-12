/** Arquivo acima do limite permitido. Mapear para HTTP 400. */
export class FileTooLargeError extends Error {
  constructor(
    readonly actualBytes: number,
    readonly maxBytes: number,
  ) {
    super(`Arquivo muito grande: ${actualBytes} bytes (máximo ${maxBytes}).`);
    this.name = "FileTooLargeError";
  }
}
