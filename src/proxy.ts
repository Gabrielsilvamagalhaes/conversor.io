import { type NextRequest, NextResponse } from "next/server";
import { PROTECTED_PATHS, SESSION_COOKIE_NAME } from "@/shared/constants/auth";

/**
 * Proxy do Next.js 16 (sucessor do `middleware.ts`).
 *
 * Roda no Edge runtime, onde o Firebase Admin SDK não funciona — por isso aqui
 * fazemos apenas um *gate* barato por presença do cookie de sessão. A verificação
 * criptográfica completa acontece server-side via `getServerSession()` (Node runtime).
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/history/:path*", "/settings/:path*"],
};
