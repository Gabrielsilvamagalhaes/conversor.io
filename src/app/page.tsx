import { CatalogGrid } from "@/components/landing/catalog-grid";
import { summarizeCatalog } from "@/components/landing/catalog-stats";
import { CategoryBand } from "@/components/landing/category-band";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getContainer } from "@/di/container";
import { MAX_VIDEO_SIZE_MB } from "@/shared/constants/upload";

/**
 * Landing pública. Server Component: lê o catálogo direto do container, então contagens,
 * pares e selos de "em breve" nunca divergem do que o app realmente faz.
 */
export default function Home() {
  const catalog = getContainer().getConversionCatalog.execute();
  const stats = summarizeCatalog(catalog);
  const documents = catalog.categories.find((category) => category.id === "documents");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero stats={stats} />
        <CategoryBand catalog={catalog} />
        <HowItWorks />
        <Features />
        <CatalogGrid catalog={catalog} stats={stats} />
        <Faq maxDocumentSizeMb={documents?.maxSizeMb ?? 4} maxVideoSizeMb={MAX_VIDEO_SIZE_MB} />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}
