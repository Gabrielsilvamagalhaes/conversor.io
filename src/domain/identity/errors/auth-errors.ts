/** Erro de domínio do contexto Identidade. Mapeado para HTTP 401 na presentation. */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
