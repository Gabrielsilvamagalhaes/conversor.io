/** Nome do cookie de sessão — convenção Firebase + Next. */
export const SESSION_COOKIE_NAME = "__session";

/** Tempo de vida do session cookie: 5 dias (ajustável). */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

/** Rotas que exigem sessão (verificação completa server-side). */
export const PROTECTED_PATHS = ["/app", "/dashboard"] as const;
