import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerSession } from "@/infrastructure/auth/server-session";

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <Link href="/dashboard" className="font-display text-lg font-semibold">
          conversor<span className="text-sanguine">.io</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>{user.email ?? "sessão ativa"}</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="text-xs uppercase tracking-[0.22em] text-gold">Painel</span>
        <h1 className="mt-3 font-display text-3xl">Seu ateliê está em preparo</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          Histórico de conversões, atalhos e preferências chegam na próxima etapa. Por ora, siga
          convertendo suas planilhas.
        </p>
        <Link
          href="/app"
          className="mt-8 rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Ir para o conversor
        </Link>
      </main>
    </div>
  );
}
