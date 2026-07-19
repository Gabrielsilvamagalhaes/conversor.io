import type { PdfPreview, PdfReaderPort } from "@/domain/conversion/ports/pdf-reader.port";

export interface PreviewPdfInput {
  readonly bytes: Uint8Array;
}

/** Lê metadados e amostra de texto de um PDF via PdfReaderPort. */
export class PreviewPdfUseCase {
  constructor(private readonly reader: PdfReaderPort) {}

  execute(input: PreviewPdfInput): Promise<PdfPreview> {
    return this.reader.read(input.bytes);
  }
}
