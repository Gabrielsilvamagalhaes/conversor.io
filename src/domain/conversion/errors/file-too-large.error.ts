const BYTES_PER_MB = 1024 * 1024;

/**
 * Formata bytes em MB com até 1 casa decimal e vírgula (pt-BR). Ex.: `8,4 MB`, `4 MB`
 * (sem `,0` supérfluo quando o valor é um número inteiro de MB).
 */
function toMb(bytes: number): string {
  return (bytes / BYTES_PER_MB).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/**
 * Arquivo acima do limite permitido. Mapear para HTTP 400.
 * Mensagem em MB (pt-BR), não em bytes — bytes crus não dizem nada para o usuário final.
 * `actualBytes`/`maxBytes` continuam expostos em bytes crus para os logs estruturados.
 */
export class FileTooLargeError extends Error {
  constructor(
    readonly actualBytes: number,
    readonly maxBytes: number,
  ) {
    super(`Arquivo muito grande: ${toMb(actualBytes)} MB (máximo ${toMb(maxBytes)} MB).`);
    this.name = "FileTooLargeError";
  }
}
