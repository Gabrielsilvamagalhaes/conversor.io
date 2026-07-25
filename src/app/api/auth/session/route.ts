import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { buildRequestContext, elapsedMs, REQUEST_ID_HEADER } from "@/app/api/_lib/request-context";
import { getContainer } from "@/di/container";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

// Admin SDK precisa do runtime Node (não Edge).
export const runtime = "nodejs";

/** Cria o session cookie a partir do Firebase ID token enviado pelo client. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const log = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  const idToken = body?.idToken;

  if (!idToken) {
    const response = NextResponse.json({ error: "idToken is required" }, { status: 400 });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  try {
    const { cookie, expiresInMs } = await getContainer().createSession.execute({ idToken });
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });

    log.info({
      event: "session_created",
      status: 200,
      durationMs: elapsedMs(startedAt),
    });

    const response = NextResponse.json({ ok: true });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  } catch (error) {
    log.warn({
      event: "session_create_failed",
      status: 401,
      durationMs: elapsedMs(startedAt),
      error,
    });
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }
}

/** Retorna o usuário autenticado atual (ou `null`). */
export async function GET(): Promise<NextResponse> {
  const store = await cookies();
  const user = await getContainer().getSession.execute({
    sessionCookie: store.get(SESSION_COOKIE_NAME)?.value,
  });
  return NextResponse.json({ user });
}
