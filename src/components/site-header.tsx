import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Top nav da landing: wordmark, links e toggle de tema. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="font-display text-lg font-semibold">
        conversor<span className="text-sanguine">.io</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-muted">
        <Link href="/app" className="hidden hover:text-fg sm:inline">
          Formatos
        </Link>
        <ThemeToggle />
        <Link
          href="/login"
          className="rounded-full border border-line px-4 py-1.5 text-fg hover:bg-bg-elev"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}
