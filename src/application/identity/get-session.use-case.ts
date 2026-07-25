import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";
import type { AuthSessionPort } from "@/domain/identity/ports/auth-session.port";
import type { LoggerPort } from "@/domain/observability/ports/logger.port";

export interface GetSessionInput {
  readonly sessionCookie: string | undefined;
}

/**
 * Resolve o usuário autenticado a partir do session cookie.
 * Retorna `null` (em vez de lançar) quando não há cookie ou ele é inválido —
 * conveniente para Server Components e o `proxy.ts`.
 */
export class GetSessionUseCase {
  constructor(
    private readonly authSession: AuthSessionPort,
    private readonly logger?: LoggerPort,
  ) {}

  async execute(input: GetSessionInput): Promise<AuthenticatedUser | null> {
    if (!input.sessionCookie) return null;
    try {
      return await this.authSession.verifySessionCookie(input.sessionCookie);
    } catch (error) {
      this.logger?.warn({
        event: "session_verification_failed",
        service: "identity-service",
        error,
      });
      return null;
    }
  }
}
