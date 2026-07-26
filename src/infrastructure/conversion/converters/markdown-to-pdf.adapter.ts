import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import { buildDocDefinition } from "@/infrastructure/conversion/docx/html-to-pdfmake";
import { renderMarkdownToHtml } from "@/infrastructure/conversion/markdown/markdown-to-html";
import { getPdfMake } from "@/infrastructure/conversion/pdfmake/pdfmake-instance";

/**
 * `.md` → `.pdf`. Decodifica o markdown como UTF-8, renderiza para HTML (`marked`) e mapeia
 * para uma docDefinition do pdfmake (`html-to-pdfmake` — o mesmo mapper que serve `docx → pdf`),
 * renderizando no servidor com a fonte Roboto (suporta acentuação pt-BR).
 *
 * Limitação conhecida (v1): blocos de código (```` ``` ```` → `<pre><code>`) caem no ramo de tag
 * desconhecida do mapper, cujo `normalizeText` colapsa espaços — a indentação do código se perde
 * no PDF gerado. Preservar whitespace em `<pre>` fica para uma versão futura; a microcopy que
 * avisa o usuário sobre essa limitação é responsabilidade de outra tarefa.
 */
export class MarkdownToPdfAdapter implements FileConverterPort {
  readonly from = "md" as const;
  readonly to = "pdf" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const pdfMake = getPdfMake();

    let markdown: string;
    try {
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      // Remove o BOM (byte order mark) inicial, se presente — `marked` não o interpreta como
      // conteúdo, mas mantê-lo pode poluir o primeiro token do parser.
      const BOM_CHAR_CODE = 0xfeff;
      markdown = decoded.charCodeAt(0) === BOM_CHAR_CODE ? decoded.slice(1) : decoded;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new InvalidFileTypeError(
        `não foi possível ler o arquivo .md como texto UTF-8 (${reason}).`,
      );
    }

    let html: string;
    try {
      html = renderMarkdownToHtml(markdown);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new InvalidFileTypeError(`não foi possível interpretar o markdown (${reason}).`);
    }

    const docDefinition = buildDocDefinition(html);
    const buffer = await pdfMake.createPdf(docDefinition).getBuffer();
    return new Uint8Array(buffer);
  }
}
