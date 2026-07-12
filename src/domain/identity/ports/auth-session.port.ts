import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";

/**
 * Port de sessão de autenticação. O adapter de infraestrutura (Firebase Admin)
 * implementa este contrato — o domínio/aplicação nunca conhece o Firebase.
 */
export interface AuthSessionPort {
  /** Troca um ID token (client) por um session cookie assinado. */
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;

  /**
   * Verifica o session cookie e resolve o usuário autenticado.
   * @throws {UnauthorizedError} quando o cookie é inválido ou expirado.
   */
  verifySessionCookie(sessionCookie: string): Promise<AuthenticatedUser>;

  /** Revoga os refresh tokens associados ao cookie (logout). Idempotente. */
  revokeSession(sessionCookie: string): Promise<void>;
}
