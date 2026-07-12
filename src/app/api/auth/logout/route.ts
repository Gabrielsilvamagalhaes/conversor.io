import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

export const runtime = "nodejs";

/** Revoga a sessão no Firebase e limpa o cookie. */
export async function POST(): Promise<NextResponse> {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    await getContainer().revokeSession.execute({ sessionCookie });
    store.delete(SESSION_COOKIE_NAME);
  }

  return NextResponse.json({ ok: true });
}
