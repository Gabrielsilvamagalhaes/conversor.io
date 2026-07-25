import Image from "next/image";
import Link from "next/link";

/** Primeiro contato de todo usuário novo com o painel — sem histórico ainda. */
export function HistoryEmptyState() {
  return (
    <div className="grid items-center gap-8 rounded-2xl border border-line bg-bg-elev p-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 md:grid-cols-[auto_1fr] md:p-10">
      <div className="relative mx-auto h-40 w-32 overflow-hidden rounded-lg md:h-48 md:w-36">
        <Image
          src="/art/selfportrait.jpg"
          alt="Autorretrato de Leonardo da Vinci"
          fill
          sizes="144px"
          className="object-cover"
        />
      </div>
      <div className="text-center md:text-left">
        <span className="text-xs uppercase tracking-[0.22em] text-gold">Página em branco</span>
        <h2 className="mt-2 font-display text-2xl">Nenhuma conversão ainda</h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Seu histórico aparece aqui assim que a primeira peça sair do ateliê. Envie um arquivo e
          veja a transmutação acontecer.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Converter um arquivo
        </Link>
      </div>
    </div>
  );
}
