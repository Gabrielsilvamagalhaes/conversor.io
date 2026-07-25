/** Ponto de dado por dia, sem depender do DTO da aplicação (módulo puro/compartilhado). */
export interface SparklineDayCount {
  readonly date: string;
  readonly count: number;
}

export interface SparklinePoint {
  readonly x: number;
  readonly y: number;
  readonly date: string;
  readonly count: number;
}

export interface SparklineGeometry {
  readonly points: readonly SparklinePoint[];
  /** `d` de um `<path>` de linha (`M...L...`). Vazio quando não há pontos. */
  readonly linePath: string;
  /** `d` de um `<path>` de área fechada até a linha de base. Vazio quando não há pontos. */
  readonly areaPath: string;
  readonly maxCount: number;
  /** Todos os dias com `count: 0` — caso degenerado, sem série para desenhar. */
  readonly isAllZero: boolean;
}

export const SPARKLINE_VIEW_WIDTH = 280;
export const SPARKLINE_VIEW_HEIGHT = 64;
const PADDING_Y = 6;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcula a geometria SVG (pontos + paths) de uma sparkline a partir de contagens diárias,
 * normalizada para `SPARKLINE_VIEW_WIDTH` × `SPARKLINE_VIEW_HEIGHT`. Puro — sem DOM, sem
 * medição de layout — para caber num `viewBox` com `preserveAspectRatio="none"`.
 */
export function computeSparklineGeometry(byDay: readonly SparklineDayCount[]): SparklineGeometry {
  const maxCount = byDay.reduce((max, d) => Math.max(max, d.count), 0);
  const isAllZero = maxCount === 0;
  const n = byDay.length;
  const baseline = SPARKLINE_VIEW_HEIGHT - PADDING_Y;
  const usableHeight = SPARKLINE_VIEW_HEIGHT - PADDING_Y * 2;
  const stepX = n > 1 ? SPARKLINE_VIEW_WIDTH / (n - 1) : 0;

  const points: SparklinePoint[] = byDay.map((d, i) => {
    const x = n > 1 ? i * stepX : SPARKLINE_VIEW_WIDTH / 2;
    const ratio = isAllZero ? 0 : d.count / maxCount;
    const y = baseline - ratio * usableHeight;
    return { x: round2(x), y: round2(y), date: d.date, count: d.count };
  });

  if (points.length === 0) {
    return { points, linePath: "", areaPath: "", maxCount, isAllZero };
  }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const first = points[0] as SparklinePoint;
  const last = points[points.length - 1] as SparklinePoint;
  const areaPath = `${linePath} L${last.x},${baseline} L${first.x},${baseline} Z`;

  return { points, linePath, areaPath, maxCount, isAllZero };
}
