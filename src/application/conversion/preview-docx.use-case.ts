import type { DocxPreview, DocxReaderPort } from "@/domain/conversion/ports/docx-reader.port";

export interface PreviewDocxInput {
  readonly bytes: Uint8Array;
}

/** Lê metadados e amostra de texto de um docx via DocxReaderPort. */
export class PreviewDocxUseCase {
  constructor(private readonly reader: DocxReaderPort) {}

  execute(input: PreviewDocxInput): Promise<DocxPreview> {
    return this.reader.read(input.bytes);
  }
}
