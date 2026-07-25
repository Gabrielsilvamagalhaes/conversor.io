import { describe, expect, it, vi } from "vitest";
import type { DocxReaderPort } from "@/domain/conversion/ports/docx-reader.port";
import { PreviewDocxUseCase } from "./preview-docx.use-case";

describe("PreviewDocxUseCase", () => {
  it("delega a leitura ao DocxReaderPort", async () => {
    const reader: DocxReaderPort = {
      read: vi.fn(async () => ({
        wordCount: 10,
        paragraphCount: 2,
        textSample: "Olá",
        truncated: false,
      })),
    };
    const useCase = new PreviewDocxUseCase(reader);
    const bytes = new Uint8Array([1, 2, 3]);

    const result = await useCase.execute({ bytes });

    expect(reader.read).toHaveBeenCalledWith(bytes);
    expect(result).toEqual({
      wordCount: 10,
      paragraphCount: 2,
      textSample: "Olá",
      truncated: false,
    });
  });
});
