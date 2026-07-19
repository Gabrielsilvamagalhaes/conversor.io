"use client";

interface CategoryTab {
  readonly id: string;
  readonly label: string;
}

interface CategoryTabsProps {
  readonly categories: readonly CategoryTab[];
  readonly active: string;
  readonly onSelect: (id: string) => void;
}

/** Seletor segmentado de categoria (Planilhas / Dados / Documentos). */
export function CategoryTabs({ categories, active, onSelect }: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Categoria de conversão"
      className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-bg-elev p-1"
    >
      {categories.map((category) => {
        const selected = category.id === active;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(category.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected ? "bg-fg text-bg" : "text-muted hover:text-fg"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
