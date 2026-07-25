import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMediaConversionReport, reportMediaConversion } from "./report-media-conversion";

function validInput(overrides: Partial<Parameters<typeof buildMediaConversionReport>[0]> = {}) {
  return {
    fileName: "video.mp4",
    from: "mp4",
    to: "mp3",
    sizeBytes: 10_000,
    outputSizeBytes: 4_000,
    durationMs: 1_500,
    ...overrides,
  };
}

describe("buildMediaConversionReport", () => {
  it("monta o payload com status completed para um par client-convertible", () => {
    const payload = buildMediaConversionReport(validInput());
    expect(payload).toEqual({ ...validInput(), status: "completed" });
  });

  it("nunca monta o payload para um par server-side (csv → xlsx)", () => {
    expect(buildMediaConversionReport(validInput({ from: "csv", to: "xlsx" }))).toBeNull();
  });

  it("nunca monta o payload para um par server-side (docx → pdf)", () => {
    expect(buildMediaConversionReport(validInput({ from: "docx", to: "pdf" }))).toBeNull();
  });

  it("nunca monta o payload para um par inexistente no catálogo", () => {
    expect(buildMediaConversionReport(validInput({ from: "mp4", to: "exe" }))).toBeNull();
  });

  it("aceita os demais pares client-convertible do catálogo", () => {
    expect(buildMediaConversionReport(validInput({ from: "webm", to: "wav" }))).not.toBeNull();
    expect(buildMediaConversionReport(validInput({ from: "mov", to: "mp3" }))).not.toBeNull();
  });
});

describe("reportMediaConversion", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("não chama fetch quando o par não é client-convertible", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    await reportMediaConversion(validInput({ from: "csv", to: "xlsx" }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("nunca lança quando o fetch falha (best-effort)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    vi.spyOn(console, "debug").mockImplementation(() => {});

    await expect(reportMediaConversion(validInput())).resolves.toBeUndefined();
  });

  it("nunca lança quando a resposta não é ok (ex.: 429/401/500)", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as unknown as typeof fetch;
    vi.spyOn(console, "debug").mockImplementation(() => {});

    await expect(reportMediaConversion(validInput())).resolves.toBeUndefined();
  });

  it("envia POST /api/conversions com o payload correto em caso de sucesso", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    global.fetch = fetchSpy as unknown as typeof fetch;

    await reportMediaConversion(validInput());

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/conversions",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validInput(), status: "completed" }),
      }),
    );
  });
});
