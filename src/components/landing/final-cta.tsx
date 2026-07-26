import Link from "next/link";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
      <Reveal>
        <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight md:text-4xl">
          Tem um arquivo no formato errado?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Solte ele aqui. Você vê o resultado antes de baixar.
        </p>
        <div className="mt-8">
          <Magnetic>
            <Link
              href="/app"
              className="inline-block rounded-full bg-fg px-8 py-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              Converter arquivo
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
