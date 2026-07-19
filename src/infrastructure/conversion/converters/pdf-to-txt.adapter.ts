import { extractText, getDocumentProxy } from "unpdf";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";

/**
 * `.pdf` → `.txt`. Extrai o texto de todas as páginas via unpdf (pdf.js) e concatena.
 * Não preserva layout — entrega o conteúdo textual em fluxo único.
 */
export class PdfToTxtAdapter implements FileConverterPort {
  readonly from = "pdf" as const;
  readonly to = "txt" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return new TextEncoder().encode(text);
  }
}
