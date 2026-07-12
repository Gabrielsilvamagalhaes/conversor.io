import "server-only";
import { cookies } from "next/headers";
import { getContainer } from "@/di/container";
import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

/**
 * Resolve o usuário autenticado em Server Components / Route Handlers (Node runtime),
 * onde a verificação completa do session cookie via Admin SDK é possível.
 */
export async function getServerSession(): Promise<AuthenticatedUser | null> {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  return getContainer().getSession.execute({ sessionCookie });
}
