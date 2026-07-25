import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { buildRequestContext, elapsedMs, REQUEST_ID_HEADER } from "@/app/api/_lib/request-context";
import { getContainer } from "@/di/container";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

export const runtime = "nodejs";

/** Revoga a sessão no Firebase e limpa o cookie. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const log = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    await getContainer().revokeSession.execute({ sessionCookie });
    store.delete(SESSION_COOKIE_NAME);
  }

  log.info({
    event: "session_revoked",
    status: 200,
    durationMs: elapsedMs(startedAt),
  });

  const response = NextResponse.json({ ok: true });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
