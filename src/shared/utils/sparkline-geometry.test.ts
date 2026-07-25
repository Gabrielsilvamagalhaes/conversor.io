import { describe, expect, it } from "vitest";
import {
  computeSparklineGeometry,
  SPARKLINE_VIEW_HEIGHT,
  SPARKLINE_VIEW_WIDTH,
} from "./sparkline-geometry";

function days(counts: readonly number[]) {
  return counts.map((count, i) => ({ date: `2026-07-${String(i + 1).padStart(2, "0")}`, count }));
}

describe("computeSparklineGeometry", () => {
  it("marca isAllZero quando todos os dias têm count 0", () => {
    const geometry = computeSparklineGeometry(days(new Array(14).fill(0)));
    expect(geometry.isAllZero).toBe(true);
    expect(geometry.maxCount).toBe(0);
  });

  it("todos os pontos ficam na linha de base quando isAllZero", () => {
    const geometry = computeSparklineGeometry(days(new Array(14).fill(0)));
    const baselineY = geometry.points[0]?.y;
    expect(geometry.points.every((p) => p.y === baselineY)).toBe(true);
  });

  it("o dia de maior contagem fica no topo (menor y)", () => {
    const geometry = computeSparklineGeometry(days([1, 5, 2]));
    const [low, high, mid] = geometry.points;
    expect(high?.y).toBeLessThan(low?.y ?? Number.POSITIVE_INFINITY);
    expect(high?.y).toBeLessThan(mid?.y ?? Number.POSITIVE_INFINITY);
  });

  it("distribui os pontos ao longo de toda a largura do viewBox", () => {
    const geometry = computeSparklineGeometry(days([1, 2, 3, 4]));
    expect(geometry.points[0]?.x).toBe(0);
    expect(geometry.points[geometry.points.length - 1]?.x).toBe(SPARKLINE_VIEW_WIDTH);
  });

  it("mantém todos os pontos dentro da altura do viewBox", () => {
    const geometry = computeSparklineGeometry(days([0, 3, 7, 1, 9, 0, 2]));
    for (const p of geometry.points) {
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(SPARKLINE_VIEW_HEIGHT);
    }
  });

  it("gera linePath e areaPath não vazios quando há pontos", () => {
    const geometry = computeSparklineGeometry(days([1, 2]));
    expect(geometry.linePath).toMatch(/^M/);
    expect(geometry.areaPath).toMatch(/Z$/);
  });

  it("retorna paths vazios para lista vazia", () => {
    const geometry = computeSparklineGeometry([]);
    expect(geometry.linePath).toBe("");
    expect(geometry.areaPath).toBe("");
    expect(geometry.points).toHaveLength(0);
  });

  it("centraliza um único ponto no meio do viewBox", () => {
    const geometry = computeSparklineGeometry(days([3]));
    expect(geometry.points[0]?.x).toBe(SPARKLINE_VIEW_WIDTH / 2);
  });
});
