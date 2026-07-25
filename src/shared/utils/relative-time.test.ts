import { describe, expect, it } from "vitest";
import { formatAbsoluteDateTime, formatRelativeTime } from "./relative-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-25T12:00:00.000Z");

  it("trata menos de 1 min como agora mesmo", () => {
    expect(formatRelativeTime("2026-07-25T11:59:30.000Z", now)).toBe("agora mesmo");
  });

  it("formata minutos", () => {
    expect(formatRelativeTime("2026-07-25T11:55:00.000Z", now)).toBe("há 5 min");
  });

  it("formata horas", () => {
    expect(formatRelativeTime("2026-07-25T09:00:00.000Z", now)).toBe("há 3 h");
  });

  it("formata dias", () => {
    expect(formatRelativeTime("2026-07-22T12:00:00.000Z", now)).toBe("há 3 d");
  });

  it("formata meses", () => {
    expect(formatRelativeTime("2026-05-20T12:00:00.000Z", now)).toBe("há 2 meses");
  });

  it("formata anos", () => {
    expect(formatRelativeTime("2024-01-01T12:00:00.000Z", now)).toBe("há 2 anos");
  });

  it("trata datas futuras (relógio adiantado) como agora mesmo", () => {
    expect(formatRelativeTime("2026-07-25T12:00:20.000Z", now)).toBe("agora mesmo");
  });
});

describe("formatAbsoluteDateTime", () => {
  it("formata em pt-BR com data e hora", () => {
    const formatted = formatAbsoluteDateTime("2026-07-25T14:32:00.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });
});
