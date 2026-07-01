import Link from "next/link";
import { redirect } from "next/navigation";
import { FileDropzone } from "@/components/file-dropzone";
import { getServerSession } from "@/infrastructure/auth/server-session";

export default async function AppPage() {
  const user = await getServerSession();
  if (!user) redirect("/login?redirect=/app");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold">
          conversor<span className="text-sanguine">.io</span>
        </Link>
        <span className="text-sm text-muted">{user.email ?? "sessão ativa"}</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <span className="text-xs uppercase tracking-[0.22em] text-gold">Transmutação</span>
        <h1 className="mt-3 font-display text-3xl">Converter arquivo</h1>
        <p className="mt-2 mb-8 text-sm text-muted">
          Comece pelo .csv. A conversão real chega na próxima fase.
        </p>
        <FileDropzone />
      </main>
    </div>
  );
}
