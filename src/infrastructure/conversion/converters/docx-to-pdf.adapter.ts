import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as mammoth from "mammoth";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import { buildDocDefinition } from "@/infrastructure/conversion/docx/html-to-pdfmake";

const require = createRequire(import.meta.url);

// Importado via `require` (não `import ... from`) de propósito: `pdfmake` é um singleton CJS
// com estado mutável (fontes/políticas de acesso vivem na própria instância). Sob o interop
// ESM do bundler, `import * as pdfMake from "pdfmake"` devolve um objeto de namespace
// somente-leitura — `pdfMake.setFonts(...)` falha ao tentar reatribuir `this.fonts` dentro do
// método porque `this` aponta para esse namespace congelado, não para o singleton real.
const pdfMake = require("pdfmake") as typeof import("pdfmake");

// As fontes Roboto do pdfmake (Apache-2.0, embutidas no pacote) são copiadas para
// `./fonts/Roboto` dentro deste módulo — não resolvidas via `require.resolve("pdfmake/...")`.
// Tanto o Turbopack quanto o webpack reescrevem `require.resolve(<literal>)` para um id de
// módulo numérico (funciona para `require`, quebra quem precisa do caminho real em disco) e
// rejeitam um especificador dinâmico como "expressão dinâmica demais" — qualquer uma das duas
// formas derrubava o `next build` assim que este módulo entrava no grafo de alguma rota.
// `new URL(caminho-relativo, import.meta.url)` é o padrão que os dois bundlers reconhecem e
// tratam como asset estático (copiam o arquivo para o output e resolvem o caminho real).
function fontPath(fileName: string): string {
  return fileURLToPath(new URL(`../docx/fonts/Roboto/${fileName}`, import.meta.url));
}

let fontsRegistered = false;

/** Registra a fonte Roboto (copiada do pacote pdfmake) uma única vez por processo. */
function ensureFontsRegistered(): void {
  if (fontsRegistered) return;

  pdfMake.setFonts({
    Roboto: {
      normal: fontPath("Roboto-Regular.ttf"),
      bold: fontPath("Roboto-Medium.ttf"),
      italics: fontPath("Roboto-Italic.ttf"),
      bolditalics: fontPath("Roboto-MediumItalic.ttf"),
    },
  });
  // Silencia os avisos do pdfmake sobre políticas de acesso: não buscamos URLs remotas
  // (imagens só entram como data URI) e o único arquivo local acessado é a fonte acima.
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy(() => true);
  fontsRegistered = true;
}

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
    ensureFontsRegistered();

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
