import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Typewriter } from "@/components/typewriter";

const PHRASES = ["um mestre.", "Da Vinci.", "do Renascimento.", "um relojoeiro."];
const FORMATS: readonly { label: string; live: boolean }[] = [
  { label: "csv ↔ xlsx", live: true },
  { label: "docx → pdf", live: false },
  { label: "pdf → txt", live: false },
  { label: "json ↔ csv", live: false },
  { label: "vídeo → áudio", live: false },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-gold before:inline-block before:h-px before:w-7 before:bg-gold">
              Renascença digital
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.04] tracking-tight md:text-5xl">
              Converta arquivos com a precisão de{" "}
              <Typewriter words={PHRASES} className="italic text-sanguine" />
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Upload, transmutação no servidor, download. Planilhas, documentos, dados e mídia — em
              segundos, sem fricção.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/app"
                className="rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Começar a converter
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-line px-6 py-3 text-sm font-medium hover:bg-bg-elev"
              >
                Entrar
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <span
                  key={f.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                    f.live ? "border-sanguine/50 bg-sanguine/5 text-fg" : "border-line text-muted"
                  }`}
                >
                  {f.live ? <span className="h-1.5 w-1.5 rounded-full bg-sanguine" /> : null}
                  {f.label}
                  {f.live ? null : <span className="text-[0.65rem] opacity-70">em breve</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-bg-elev md:aspect-auto md:h-[34rem]">
            <Image
              src="/art/vitruvian.jpg"
              alt="Homem Vitruviano de Leonardo da Vinci"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-[50%_16%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            <p className="absolute bottom-3 right-3 text-right text-[0.65rem] leading-tight text-muted">
              <span className="font-display text-fg">Homo Vitruvianus</span>
              <br />
              Leonardo da Vinci · c. 1490
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
