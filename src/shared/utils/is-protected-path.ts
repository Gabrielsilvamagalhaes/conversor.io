/** True se `pathname` é a rota protegida exata ou uma subrota dela. */
export function isProtectedPath(pathname: string, protectedPaths: readonly string[]): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
