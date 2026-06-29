import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";
import type { AuthSessionPort } from "@/domain/identity/ports/auth-session.port";

export interface GetSessionInput {
  readonly sessionCookie: string | undefined;
}

/**
 * Resolve o usuário autenticado a partir do session cookie.
 * Retorna `null` (em vez de lançar) quando não há cookie ou ele é inválido —
 * conveniente para Server Components e o `proxy.ts`.
 */
export class GetSessionUseCase {
  constructor(private readonly authSession: AuthSessionPort) {}

  async execute(input: GetSessionInput): Promise<AuthenticatedUser | null> {
    if (!input.sessionCookie) return null;
    try {
      return await this.authSession.verifySessionCookie(input.sessionCookie);
    } catch {
      return null;
    }
  }
}
