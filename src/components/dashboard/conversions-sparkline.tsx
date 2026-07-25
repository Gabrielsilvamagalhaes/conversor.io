import type { ConversionDayCountDto } from "@/application/conversion/history/conversion-history.dto";
import {
  computeSparklineGeometry,
  SPARKLINE_VIEW_HEIGHT,
  SPARKLINE_VIEW_WIDTH,
} from "@/shared/utils/sparkline-geometry";

interface ConversionsSparklineProps {
  readonly byDay: readonly ConversionDayCountDto[];
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** `date` é `YYYY-MM-DD`; construímos em UTC para não deslocar o dia por fuso horário. */
function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return date;
  return DAY_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Sparkline SVG inline dos últimos 14 dias — sem lib nova. Acessível: `role="img"` +
 * `aria-label` resumindo a série, `<title>` no SVG, e uma tabela `sr-only` com data/contagem
 * (o gráfico nunca é a única forma de acessar o dado). Caso todos os dias estejam zerados,
 * desenha só a linha de base com uma microcopy honesta, em vez de um gráfico vazio quebrado.
 */
export function ConversionsSparkline({ byDay }: ConversionsSparklineProps) {
  const geometry = computeSparklineGeometry(byDay);
  const total = byDay.reduce((sum, d) => sum + d.count, 0);
  const first = byDay[0];
  const last = byDay[byDay.length - 1];
  const summary =
    geometry.isAllZero || !first || !last
      ? `Nenhuma conversão nos últimos ${byDay.length} dias.`
      : `${total} conversões entre ${formatDayLabel(first.date)} e ${formatDayLabel(last.date)}.`;

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Últimos 14 dias</h2>

      <svg
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${SPARKLINE_VIEW_WIDTH} ${SPARKLINE_VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-4 h-16 w-full motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
      >
        <title>{summary}</title>
        <line
          x1={0}
          y1={SPARKLINE_VIEW_HEIGHT - 6}
          x2={SPARKLINE_VIEW_WIDTH}
          y2={SPARKLINE_VIEW_HEIGHT - 6}
          stroke="var(--line)"
          strokeWidth={1}
        />
        {geometry.isAllZero ? null : (
          <>
            <path d={geometry.areaPath} fill="var(--sanguine)" opacity={0.12} stroke="none" />
            <path
              d={geometry.linePath}
              fill="none"
              stroke="var(--sanguine)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>

      {geometry.isAllZero ? (
        <p className="mt-3 text-xs text-muted">
          Sem conversões por aqui ainda — os últimos {byDay.length} dias estão quietos.
        </p>
      ) : null}

      <table className="sr-only">
        <caption>Conversões por dia, últimos {byDay.length} dias</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Conversões</th>
          </tr>
        </thead>
        <tbody>
          {byDay.map((d) => (
            <tr key={d.date}>
              <td>{formatDayLabel(d.date)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
