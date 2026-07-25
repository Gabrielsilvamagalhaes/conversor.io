import type { ConversionStatsDto } from "@/application/conversion/history/conversion-history.dto";
import { formatBytes } from "@/shared/utils/format-bytes";

interface StatsTilesProps {
  readonly stats: ConversionStatsDto;
}

interface Tile {
  readonly label: string;
  readonly value: string;
}

/**
 * 4 tiles de métricas agregadas. Separação por `--line` (1px, via `gap-px` + fundo `--line`
 * no wrapper) em vez de bordas grossas ou sombra — o número respira, o rótulo fica discreto.
 */
export function StatsTiles({ stats }: StatsTilesProps) {
  const tiles: readonly Tile[] = [
    { label: "Conversões totais", value: stats.total.toLocaleString("pt-BR") },
    { label: "Últimos 30 dias", value: stats.last30Days.toLocaleString("pt-BR") },
    { label: "Volume processado", value: formatBytes(stats.totalBytes) },
    {
      label: "Par mais usado",
      value: stats.topPair
        ? `${stats.topPair.from.toUpperCase()} → ${stats.topPair.to.toUpperCase()}`
        : "—",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
      {tiles.map((tile, i) => (
        <div
          key={tile.label}
          className="bg-bg-elev px-5 py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
        >
          <dt className="text-xs uppercase tracking-wide text-muted">{tile.label}</dt>
          <dd className="mt-2 truncate font-display text-3xl tabular-nums" title={tile.value}>
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
