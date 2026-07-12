import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

// Admin SDK precisa do runtime Node (não Edge).
export const runtime = "nodejs";

/** Cria o session cookie a partir do Firebase ID token enviado pelo client. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  const idToken = body?.idToken;

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
