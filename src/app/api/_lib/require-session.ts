import "server-only";
import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";
import { UnauthorizedError } from "@/domain/identity/errors/auth-errors";
import { getServerSession } from "@/infrastructure/auth/server-session";

/**
 * Exige uma sessão válida em rotas que não podem ser acessadas anonimamente.
 * Lança `UnauthorizedError` (mapeada para HTTP 401 por `mapDomainError`) quando não
 * há cookie de sessão ou ele é inválido/expirado — a rota só precisa deixar o erro
 * propagar até o `catch` e chamar `toErrorResponse`.
 */
export async function requireSession(): Promise<AuthenticatedUser> {
  const user = await getServerSession();
  if (!user) {
    throw new UnauthorizedError("Sessão expirada ou ausente. Faça login para continuar.");
  }
  return user;
}
