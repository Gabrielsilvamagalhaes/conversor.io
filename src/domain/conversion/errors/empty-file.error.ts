/** Arquivo sem conteúdo (0 bytes). Mapear para HTTP 400 na presentation. */
export class EmptyFileError extends Error {
  constructor() {
    super("O arquivo está vazio.");
    this.name = "EmptyFileError";
  }
}
