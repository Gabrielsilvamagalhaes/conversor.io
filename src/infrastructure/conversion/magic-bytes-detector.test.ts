import { describe, expect, it } from "vitest";
import { MagicBytesDetector } from "./magic-bytes-detector";

const detector = new MagicBytesDetector();

describe("MagicBytesDetector", () => {
  it("reconhece texto csv como não-binário sem assinatura", () => {
    const out = detector.detect(new TextEncoder().encode("a,b\n1,2"));
    expect(out.isBinary).toBe(false);
    expect(out.signature).toBeNull();
  });

  it("detecta assinatura ZIP (PK)", () => {
    const out = detector.detect(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]));
    expect(out.signature).toBe("zip");
  });

  it("detecta assinatura PDF", () => {
    const out = detector.detect(new TextEncoder().encode("%PDF-1.7"));
    expect(out.signature).toBe("pdf");
  });

  it("detecta executável (MZ)", () => {
    const out = detector.detect(new Uint8Array([0x4d, 0x5a, 0x90]));
    expect(out.signature).toBe("exe");
  });

  it("marca binário quando há byte NUL", () => {
    const out = detector.detect(new Uint8Array([0x61, 0x00, 0x62]));
    expect(out.isBinary).toBe(true);
  });

  it("detecta assinatura WEBP (RIFF + WEBP no offset 8)", () => {
    const out = detector.detect(
      new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // tamanho (irrelevante para a detecção)
        0x57,
        0x45,
        0x42,
        0x50, // WEBP
      ]),
    );
    expect(out.signature).toBe("webp");
  });

  it("NÃO detecta um WAV (RIFF + WAVE) como webp — RIFF sozinho não basta", () => {
    const out = detector.detect(
      new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // tamanho
        0x57,
        0x41,
        0x56,
        0x45, // WAVE
      ]),
    );
    expect(out.signature).not.toBe("webp");
    expect(out.signature).toBeNull();
  });
});
