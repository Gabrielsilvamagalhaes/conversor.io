import { createRequire } from "node:module";
import { resolveRobotoFontPaths } from "@/infrastructure/conversion/docx/fonts/roboto-font-paths";

const require = createRequire(import.meta.url);

// Importado via `require` (não `import ... from`) de propósito: `pdfmake` é um singleton CJS
// com estado mutável (fontes/políticas de acesso vivem na própria instância). Sob o interop
// ESM do bundler, `import * as pdfMake from "pdfmake"` devolve um objeto de namespace
// somente-leitura — `pdfMake.setFonts(...)` falha ao tentar reatribuir `this.fonts` dentro do
// método porque `this` aponta para esse namespace congelado, não para o singleton real.
const pdfMake = require("pdfmake") as typeof import("pdfmake");

let fontsRegistered = false;

/**
 * Devolve a instância singleton do `pdfmake`, já com a fonte Roboto (normal/bold/italics/
 * bolditalics) e as políticas de acesso registradas — feito uma única vez por processo.
 * Consumida por qualquer adapter que precise gerar PDF (`docx → pdf`, `markdown → pdf`).
 */
export function getPdfMake(): typeof import("pdfmake") {
  if (fontsRegistered) return pdfMake;

  const fontPaths = resolveRobotoFontPaths();
  pdfMake.setFonts({
    Roboto: {
      normal: fontPaths.normal,
      bold: fontPaths.bold,
      italics: fontPaths.italics,
      bolditalics: fontPaths.bolditalics,
    },
  });
  // Silencia os avisos do pdfmake sobre políticas de acesso: não buscamos URLs remotas
  // (imagens só entram como data URI) e o único arquivo local acessado é a fonte acima.
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy(() => true);
  fontsRegistered = true;

  return pdfMake;
}
