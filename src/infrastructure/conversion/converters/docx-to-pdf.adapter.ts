import * as mammoth from "mammoth";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import { buildDocDefinition } from "@/infrastructure/conversion/docx/html-to-pdfmake";
import { getPdfMake } from "@/infrastructure/conversion/pdfmake/pdfmake-instance";

/**
 * `.docx` → `.pdf`. Extrai o HTML do docx via mammoth, mapeia para uma docDefinition do
 * pdfmake (`html-to-pdfmake`) e renderiza no servidor com a fonte Roboto (suporta acentuação
 * pt-BR). Avisos do mammoth (`result.messages`) são ignorados de propósito — só a falha de
 * leitura do arquivo vira erro de domínio.
 */
export class DocxToPdfAdapter implements FileConverterPort {
  readonly from = "docx" as const;
  readonly to = "pdf" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const pdfMake = getPdfMake();

    let html: string;
    try {
      const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
      html = result.value;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new InvalidFileTypeError(`não foi possível ler o arquivo .docx (${reason}).`);
    }

    const docDefinition = buildDocDefinition(html);
    const buffer = await pdfMake.createPdf(docDefinition).getBuffer();
    return new Uint8Array(buffer);
  }
}
