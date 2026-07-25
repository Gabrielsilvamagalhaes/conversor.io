import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleJsonLogger } from "./console-json-logger";

function captureStdout() {
  const lines: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  });
  return { lines, spy };
}

describe("ConsoleJsonLogger", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("redige contexto sensível e nunca vaza os valores originais na linha emitida", () => {
    const { lines, spy } = captureStdout();
    const logger = new ConsoleJsonLogger();

    logger.info({
      event: "conversion_succeeded",
      context: {
        idToken: "x",
        cookie: "y",
        fileName: "contrato-joao.pdf",
        sessionCookie: "z",
        safe: "ok",
      },
    });

    spy.mockRestore();
    expect(lines).toHaveLength(1);
    const line = lines[0] ?? "";

    expect(line).not.toContain('"x"');
    expect(line).not.toContain('"y"');
    expect(line).not.toContain("contrato-joao.pdf");
    expect(line).not.toContain('"z"');
    expect(line).toContain("ok");
  });

  it("emite uma linha de JSON válido, terminada em \\n, com a ordem de chaves esperada", () => {
    const { lines, spy } = captureStdout();
    const logger = new ConsoleJsonLogger();

    logger.info({
      event: "conversion_started",
      service: "conversion-service",
      requestId: "req-1",
      status: 200,
      durationMs: 812,
    });

    spy.mockRestore();
    const raw = lines[0] ?? "";
    expect(raw.endsWith("\n")).toBe(true);

    const parsed = JSON.parse(raw);
    expect(Object.keys(parsed)).toEqual([
      "timestamp",
      "level",
      "service",
      "event",
      "requestId",
      "durationMs",
      "status",
    ]);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("conversion_started");
  });

  it("omite chaves undefined em vez de emitir null", () => {
    const { lines, spy } = captureStdout();
    const logger = new ConsoleJsonLogger();

    logger.warn({ event: "session_verification_failed" });

    spy.mockRestore();
    const parsed = JSON.parse(lines[0] ?? "");

    expect(parsed).not.toHaveProperty("userId");
    expect(parsed).not.toHaveProperty("requestId");
    expect(parsed).not.toHaveProperty("clientIp");
    expect(parsed).not.toHaveProperty("context");
    expect(parsed).not.toHaveProperty("error");
  });

  it("serializa o erro (name/message/stack), nunca o objeto de erro cru", () => {
    const { lines, spy } = captureStdout();
    const logger = new ConsoleJsonLogger();

    logger.error({ event: "unhandled_error", status: 500, error: new Error("boom") });

    spy.mockRestore();
    const parsed = JSON.parse(lines[0] ?? "");

    expect(parsed.error).toEqual({
      name: "Error",
      message: "boom",
      stack: expect.stringContaining("Error: boom"),
    });
  });

  it("child() herda os bindings do pai sem mutar a instância original", () => {
    const { lines, spy } = captureStdout();
    const parent = new ConsoleJsonLogger({ service: "api-gateway", requestId: "req-parent" });
    const child = parent.child({ userId: "user-1" });

    child.info({ event: "conversion_started" });
    parent.info({ event: "conversion_started" });

    spy.mockRestore();
    const childLine = JSON.parse(lines[0] ?? "");
    const parentLine = JSON.parse(lines[1] ?? "");

    expect(childLine.requestId).toBe("req-parent");
    expect(childLine.userId).toBe("user-1");
    expect(parentLine).not.toHaveProperty("userId");
    expect(parentLine.requestId).toBe("req-parent");
  });

  it("em desenvolvimento emite uma linha legível de texto (sem JSON, sem cores ANSI)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const { lines, spy } = captureStdout();
    const logger = new ConsoleJsonLogger();

    logger.info({ event: "conversion_succeeded", status: 200, durationMs: 812 });

    spy.mockRestore();
    const line = lines[0] ?? "";

    expect(line).toContain("INFO");
    expect(line).toContain("conversion_succeeded");
    expect(line).toContain("status=200");
    expect(line).toContain("durationMs=812");
    // biome-ignore lint/suspicious/noControlCharactersInRegex: precisa checar o ESC de cores ANSI
    expect(line).not.toMatch(/\x1b\[/);
  });
});
