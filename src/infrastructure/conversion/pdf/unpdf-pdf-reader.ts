import { extractText, getDocumentProxy } from "unpdf";
import type { PdfPreview, PdfReaderPort } from "@/domain/conversion/ports/pdf-reader.port";
import { MAX_PDF_TEXT_SAMPLE } from "@/shared/constants/upload";

/**
 * Lê metadados de um PDF via unpdf (pdf.js): total de páginas e uma amostra de
 * texto (limitada a MAX_PDF_TEXT_SAMPLE chars), usada como fallback quando o
 * client não consegue renderizar a 1ª página como imagem.
 */
export class UnpdfPdfReader implements PdfReaderPort {
  async read(bytes: Uint8Array): Promise<PdfPreview> {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const textSample = text.slice(0, MAX_PDF_TEXT_SAMPLE);
    return { pageCount: pdf.numPages, textSample };
  }
}
