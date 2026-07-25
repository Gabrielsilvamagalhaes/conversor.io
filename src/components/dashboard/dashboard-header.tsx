import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthenticatedUser } from "@/domain/identity/entities/authenticated-user";

interface DashboardHeaderProps {
  readonly user: AuthenticatedUser;
}

/** Cabeçalho do painel: saudação, tema, atalho para nova conversão e sair. */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  const name = user.displayName ?? user.email;
  const firstName = name?.split(" ")[0];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5 md:px-10">
      <div>
        <Link href="/dashboard" className="font-display text-lg font-semibold">
          conversor<span className="text-sanguine">.io</span>
        </Link>
        <p className="mt-0.5 text-sm text-muted">
          {firstName ? `Olá, ${firstName}` : "Bem-vindo de volta"}
        </p>
      </div>
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/app"
          className="rounded-full border border-line px-4 py-1.5 text-fg hover:bg-bg-elev"
        >
          Nova conversão
        </Link>
        <ThemeToggle />
        <SignOutButton />
      </nav>
    </header>
  );
}
