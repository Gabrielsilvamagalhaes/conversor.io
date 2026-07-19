import { describe, expect, it, vi } from "vitest";
import type { PdfReaderPort } from "@/domain/conversion/ports/pdf-reader.port";
import { PreviewPdfUseCase } from "./preview-pdf.use-case";

describe("PreviewPdfUseCase", () => {
  it("delega a leitura ao PdfReaderPort", async () => {
    const reader: PdfReaderPort = {
      read: vi.fn(async () => ({ pageCount: 3, textSample: "Olá" })),
    };
    const useCase = new PreviewPdfUseCase(reader);
    const bytes = new Uint8Array([1, 2, 3]);

    const result = await useCase.execute({ bytes });

    expect(reader.read).toHaveBeenCalledWith(bytes);
    expect(result).toEqual({ pageCount: 3, textSample: "Olá" });
  });
});
