import Link from "next/link";
import { redirect } from "next/navigation";
import { FileDropzone } from "@/components/file-dropzone";
import { ThemeToggle } from "@/components/theme-toggle";
import { getContainer } from "@/di/container";
import { getServerSession } from "@/infrastructure/auth/server-session";

export default async function AppPage() {
  const user = await getServerSession();
  if (!user) redirect("/login?redirect=/app");

  const catalog = getContainer().getConversionCatalog.execute();

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
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <span className="text-xs uppercase tracking-[0.22em] text-gold">Conversão</span>
        <h1 className="mt-3 font-display text-3xl">Converter arquivo</h1>
        <p className="mt-2 mb-8 max-w-md text-center text-sm text-muted">
          Escolha a categoria e envie o arquivo. Validamos e mostramos uma prévia antes de
          converter.
        </p>
        <FileDropzone catalog={catalog} />
      </main>
    </div>
  );
}
