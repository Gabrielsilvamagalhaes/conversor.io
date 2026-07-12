import { type NextRequest, NextResponse } from "next/server";
import { PROTECTED_PATHS, SESSION_COOKIE_NAME } from "@/shared/constants/auth";
import { isProtectedPath } from "@/shared/utils/is-protected-path";

/**
 * Proxy do Next.js 16 (sucessor do `middleware.ts`). Roda no Edge — gate barato
 * por presença do cookie; a verificação completa é server-side (Node runtime).
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname, PROTECTED_PATHS)) return NextResponse.next();

  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*"],
};
