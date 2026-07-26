import type { ConversionCatalogDto } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { Reveal } from "@/components/motion/reveal";
import type { CatalogStats } from "./catalog-stats";

interface CatalogGridProps {
  readonly catalog: ConversionCatalogDto;
  readonly stats: CatalogStats;
}

/** Todos os pares do catálogo, inclusive os que ainda não estão prontos — marcados como tal. */
export function CatalogGrid({ catalog, stats }: CatalogGridProps) {
  return (
    <section aria-labelledby="catalogo" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="catalogo" className="font-display text-2xl md:text-3xl">
          Catálogo completo
        </h2>
        <p className="text-sm text-muted">
          {stats.liveConversions} prontas
          {stats.comingSoon > 0 ? ` · ${stats.comingSoon} em breve` : ""}
        </p>
      </div>

      <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.categories.map((category, index) => (
          <Reveal key={category.id} delay={index * 0.05}>
            <h3 className="border-b border-line pb-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
              {category.label}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {category.pairs.map((pair) => (
                <li key={`${pair.from}-${pair.to}`} className="flex items-baseline gap-2 text-sm">
                  <span className="text-fg">
                    .{pair.from} <span className="text-sanguine">→</span> .{pair.to}
                  </span>
                  {pair.live ? (
                    pair.engine === "client" ? (
                      <span className="text-xs text-muted">no navegador</span>
                    ) : null
                  ) : (
                    <span className="text-xs text-muted/70">em breve</span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
