import * as mammoth from "mammoth";
import type { DocxPreview, DocxReaderPort } from "@/domain/conversion/ports/docx-reader.port";
import { MAX_DOCX_TEXT_SAMPLE } from "@/shared/constants/upload";

/**
 * Lê metadados de um `.docx` via mammoth (`extractRawText`): total de palavras/parágrafos e
 * uma amostra de texto (limitada a `MAX_DOCX_TEXT_SAMPLE` chars), usada como fallback quando
 * o client não consegue renderizar uma prévia visual do documento.
 */
export class MammothDocxReader implements DocxReaderPort {
  async read(bytes: Uint8Array): Promise<DocxPreview> {
    const { value: rawText } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });

    // mammoth separa parágrafos com "\n\n" (parágrafos vazios também produzem essa marca).
    const paragraphCount = rawText
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0).length;

    const wordCount = rawText
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0).length;

    return {
      wordCount,
      paragraphCount,
      textSample: rawText.slice(0, MAX_DOCX_TEXT_SAMPLE),
      truncated: rawText.length > MAX_DOCX_TEXT_SAMPLE,
    };
  }
}
