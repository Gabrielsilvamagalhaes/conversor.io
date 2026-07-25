import { describe, expect, it } from "vitest";
import { MAX_VIDEO_SIZE_BYTES } from "@/shared/constants/upload";
import { recordConversionSchema } from "./record-conversion.schema";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    fileName: "video.mp4",
    from: "mp4",
    to: "mp3",
    sizeBytes: 1_000,
    outputSizeBytes: 500,
    durationMs: 2_000,
    status: "completed",
    ...overrides,
  };
}

describe("recordConversionSchema", () => {
  it("aceita um payload válido", () => {
    const result = recordConversionSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("rejeita um par de conversão server-side (não convertível no client)", () => {
    const result = recordConversionSchema.safeParse(validPayload({ from: "csv", to: "xlsx" }));
    expect(result.success).toBe(false);
  });

  it("rejeita um par inexistente no catálogo", () => {
    const result = recordConversionSchema.safeParse(validPayload({ from: "mp4", to: "exe" }));
    expect(result.success).toBe(false);
  });

  it("rejeita sizeBytes acima do teto de vídeo", () => {
    const result = recordConversionSchema.safeParse(
      validPayload({ sizeBytes: MAX_VIDEO_SIZE_BYTES + 1 }),
    );
    expect(result.success).toBe(false);
  });

  it('rejeita status "failed" sem errorCode', () => {
    const result = recordConversionSchema.safeParse(validPayload({ status: "failed" }));
    expect(result.success).toBe(false);
  });

  it('aceita status "failed" com errorCode', () => {
    const result = recordConversionSchema.safeParse(
      validPayload({ status: "failed", errorCode: "ConversionTimeoutError" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejeita durationMs negativo ou fora do teto de 1h", () => {
    expect(recordConversionSchema.safeParse(validPayload({ durationMs: -1 })).success).toBe(false);
    expect(recordConversionSchema.safeParse(validPayload({ durationMs: 3_600_001 })).success).toBe(
      false,
    );
  });

  it("rejeita fileName vazio ou maior que 255 caracteres", () => {
    expect(recordConversionSchema.safeParse(validPayload({ fileName: "" })).success).toBe(false);
    expect(
      recordConversionSchema.safeParse(validPayload({ fileName: "a".repeat(256) })).success,
    ).toBe(false);
  });
});
