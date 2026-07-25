import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("formata milissegundos abaixo de 1 s", () => {
    expect(formatDuration(812)).toBe("812 ms");
    expect(formatDuration(0)).toBe("0 ms");
  });

  it("formata segundos com vírgula decimal pt-BR abaixo de 1 min", () => {
    expect(formatDuration(1400)).toBe("1,4 s");
    expect(formatDuration(59_900)).toBe("59,9 s");
  });

  it("formata minutos e segundos a partir de 1 min", () => {
    expect(formatDuration(60_000)).toBe("1 min 0 s");
    expect(formatDuration(125_000)).toBe("2 min 5 s");
  });

  it("trata negativos e não finitos como indisponível", () => {
    expect(formatDuration(-5)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
  });
});
