import { truncateIp } from "@/infrastructure/observability/redact";

/** Header usado para correlacionar logs de uma mesma requisição entre serviços. */
export const REQUEST_ID_HEADER = "x-request-id";

export interface RequestContext {
  readonly requestId: string;
  readonly clientIp?: string;
}

/**
 * Deriva o contexto de observabilidade de uma requisição: `requestId` (do header, do
 * `x-vercel-id` ou gerado) e `clientIp` (primeiro IP de `x-forwarded-for`, já truncado).
 */
export function buildRequestContext(request: Request): RequestContext {
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ??
    request.headers.get("x-vercel-id") ??
    crypto.randomUUID();

  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstIp = forwardedFor?.split(",")[0]?.trim();
  const clientIp = truncateIp(firstIp);

  return { requestId, clientIp };
}

/** Duração decorrida, em milissegundos, desde `startedAt` (obtido via `Date.now()`). */
export function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}
