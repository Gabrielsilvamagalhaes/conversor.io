import Link from "next/link";
import { MirrorWordmark } from "@/components/landing/mirror-wordmark";
import { Magnetic } from "@/components/motion/magnetic";
import { ParallaxImage } from "@/components/motion/parallax-image";
import type { CatalogStats } from "./catalog-stats";

interface HeroProps {
  readonly stats: CatalogStats;
}

export function Hero({ stats }: HeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pb-24 md:pt-16">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
        Do códice ao código
      </p>

      <div className="mt-6">
        <MirrorWordmark>conversor.io</MirrorWordmark>
      </div>

      <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-[1.05fr_0.95fr] md:items-end">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl leading-[1.12] tracking-tight md:text-4xl">
            Seu arquivo no formato que você precisa, em segundos.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Planilhas, documentos, dados e imagens são convertidos no servidor. Vídeo vira áudio sem
            sair do seu navegador — o arquivo nem chega a subir.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <Link
                href="/app"
                className="inline-block rounded-full bg-fg px-7 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Converter arquivo
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/login"
                className="inline-block rounded-full border border-line px-7 py-3 text-sm font-medium transition-colors hover:bg-bg-elev"
              >
                Entrar
              </Link>
            </Magnetic>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
            <Figure value={stats.liveConversions} label="conversões prontas" />
            <Figure value={stats.formats} label="formatos" />
            <Figure value={stats.categories} label="categorias" />
          </dl>
        </div>

        <ParallaxImage
          src="/art/vitruvian-1200.webp"
          alt="Homem Vitruviano, de Leonardo da Vinci"
          sizes="(max-width: 768px) 100vw, 45vw"
          priority
          className="aspect-[4/5] rounded-xl bg-bg-elev md:aspect-[3/4]"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
          <p className="pointer-events-none absolute bottom-4 right-4 text-right text-[0.65rem] leading-tight text-muted">
            <span className="block font-display text-sm text-fg">Homo Vitruvianus</span>
            Leonardo da Vinci · c. 1490
          </p>
        </ParallaxImage>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-display text-3xl text-fg">{value}</span>
        <span className="ml-2 text-sm text-muted">{label}</span>
      </dd>
    </div>
  );
}
