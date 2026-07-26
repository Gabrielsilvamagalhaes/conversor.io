import Link from "next/link";
import type { ConversionCatalogDto } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { Reveal } from "@/components/motion/reveal";

interface CategoryBandProps {
  readonly catalog: ConversionCatalogDto;
}

/**
 * Faixa de contraste invertido com as categorias reais do catálogo. Usa `bg-fg`/`text-bg` em vez
 * de preto fixo: a faixa continua sendo a mais escura da página no tema claro e a mais clara no
 * tema escuro, sem nenhuma cor fora dos tokens.
 */
export function CategoryBand({ catalog }: CategoryBandProps) {
  return (
    <section aria-labelledby="categorias" className="bg-fg text-bg">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <h2 id="categorias" className="font-display text-2xl md:text-3xl">
          O que dá para converter
        </h2>

        <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.categories.map((category, index) => {
            const live = category.pairs.filter((pair) => pair.live);
            return (
              <Reveal as="li" key={category.id} delay={index * 0.06}>
                <p className="font-display text-xl">{category.label}</p>
                <p className="mt-2 text-sm opacity-70">
                  {live.length} {live.length === 1 ? "conversão" : "conversões"} · até{" "}
                  {category.maxSizeMb} MB
                </p>
                <p className="mt-3 text-sm leading-relaxed opacity-85">
                  {live.map((pair) => `${pair.from} → ${pair.to}`).join(" · ")}
                </p>
              </Reveal>
            );
          })}
        </ul>

        <Link
          href="/app"
          className="mt-12 inline-block border-b border-current pb-1 text-sm font-medium transition-opacity hover:opacity-70"
        >
          Escolher um arquivo →
        </Link>
      </div>
    </section>
  );
}
