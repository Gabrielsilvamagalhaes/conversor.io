import { describe, expect, it } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("trata zero e negativos como 0 B", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-10)).toBe("0 B");
  });

  it("mantém bytes crus abaixo de 1 KB", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("converte para KB sem casas decimais quando exato", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("converte para KB com vírgula decimal pt-BR", () => {
    expect(formatBytes(1536)).toBe("1,5 KB");
  });

  it("converte para MB", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("converte para GB", () => {
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2,5 GB");
  });

  it("não passa de TB mesmo para valores enormes", () => {
    expect(formatBytes(1024 ** 5)).toBe("1.024 TB");
  });

  it("trata NaN/Infinity como 0 B", () => {
    expect(formatBytes(Number.NaN)).toBe("0 B");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("0 B");
  });
});
