import type { AuthSessionPort } from "@/domain/identity/ports/auth-session.port";

export interface RevokeSessionInput {
  readonly sessionCookie: string;
}

/**
 * Revoga a sessão atual (logout). Idempotente — um cookie já inválido é no-op.
 * Usado em `POST /api/auth/logout`.
 */
export class RevokeSessionUseCase {
  constructor(private readonly authSession: AuthSessionPort) {}

  async execute(input: RevokeSessionInput): Promise<void> {
    await this.authSession.revokeSession(input.sessionCookie);
  }
}
