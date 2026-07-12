/** Extensão fora da allowlist ou conteúdo binário/executável disfarçado. HTTP 400. */
export class InvalidFileTypeError extends Error {
  constructor(reason: string) {
    super(`Tipo de arquivo inválido: ${reason}`);
    this.name = "InvalidFileTypeError";
  }
}
