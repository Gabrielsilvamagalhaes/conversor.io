import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";
import { UnauthorizedError } from "@/domain/identity/errors/auth-errors";
import type { AuthSessionPort } from "@/domain/identity/ports/auth-session.port";
import { getAdminAuth } from "@/infrastructure/auth/firebase-admin";

/**
 * Adapter de infraestrutura que implementa o `AuthSessionPort` usando o
 * Firebase Admin SDK. Mapeia as claims do Firebase para a entidade de domínio
 * `AuthenticatedUser`, mantendo o Firebase fora do domínio/aplicação.
 */
export class FirebaseAuthAdapter implements AuthSessionPort {
  async createSessionCookie(idToken: string, expiresInMs: number): Promise<string> {
    return getAdminAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  }

  async verifySessionCookie(sessionCookie: string): Promise<AuthenticatedUser> {
    try {
      const claims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      return {
        uid: claims.uid,
        email: claims.email ?? null,
        displayName: (claims.name as string | undefined) ?? null,
        provider: claims.firebase?.sign_in_provider ?? "unknown",
      };
    } catch {
      throw new UnauthorizedError("Invalid or expired session cookie");
    }
  }

  async revokeSession(sessionCookie: string): Promise<void> {
    try {
      const claims = await getAdminAuth().verifySessionCookie(sessionCookie);
      await getAdminAuth().revokeRefreshTokens(claims.sub);
    } catch {
      // Cookie já inválido/expirado — nada a revogar.
    }
  }
}
