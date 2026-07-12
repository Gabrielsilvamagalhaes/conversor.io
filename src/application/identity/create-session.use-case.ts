import type { AuthSessionPort } from "@/domain/identity/ports/auth-session.port";
import { SESSION_MAX_AGE_MS } from "@/shared/constants/auth";

export interface CreateSessionInput {
  readonly idToken: string;
}

export interface CreateSessionResult {
  readonly cookie: string;
  readonly expiresInMs: number;
}

/**
 * Troca o Firebase ID token (vindo do client) por um session cookie httpOnly.
 * Usado em `POST /api/auth/session`.
 */
export class CreateSessionUseCase {
  constructor(private readonly authSession: AuthSessionPort) {}

  async execute(input: CreateSessionInput): Promise<CreateSessionResult> {
    const cookie = await this.authSession.createSessionCookie(input.idToken, SESSION_MAX_AGE_MS);
    return { cookie, expiresInMs: SESSION_MAX_AGE_MS };
  }
}
