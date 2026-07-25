import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";
import { UnauthorizedError } from "@/domain/identity/errors/auth-errors";

const getServerSession = vi.fn<() => Promise<AuthenticatedUser | null>>();

vi.mock("@/infrastructure/auth/server-session", () => ({
  getServerSession: () => getServerSession(),
}));

const { requireSession } = await import("./require-session");

describe("requireSession", () => {
  it("lança UnauthorizedError quando não há sessão", async () => {
    getServerSession.mockResolvedValueOnce(null);

    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("devolve o usuário autenticado quando a sessão é válida", async () => {
    const user: AuthenticatedUser = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      provider: "password",
    };
    getServerSession.mockResolvedValueOnce(user);

    await expect(requireSession()).resolves.toEqual(user);
  });
});
