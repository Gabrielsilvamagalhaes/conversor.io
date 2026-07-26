import { closeSync, openSync, readSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Caminhos em disco das 4 variantes da fonte Roboto (normal/bold/italics/bolditalics) usadas
 * pelo pdfmake para renderizar os pares que geram PDF (`.docx → .pdf` e `.md → .pdf`).
 *
 * Cada entrada usa `new URL(caminho-literal, import.meta.url)` — nunca um template dinâmico
 * (`` `./Roboto/${nome}.ttf` ``). Turbopack e webpack só reconhecem essa chamada como
 * referência a um asset estático quando o primeiro argumento é uma string literal analisável
 * estaticamente em tempo de build. Com um template, o bundler não consegue determinar qual
 * arquivo é referenciado e colapsa as 4 chamadas para um único "vencedor" da pasta `Roboto/`
 * — hoje `NOTICE.md` (pdfkit lê o Markdown e fontkit lança `Unknown font format`), em builds
 * anteriores `Roboto-Italic.ttf` (bug silencioso: o PDF inteiro saía em itálico, sem erro).
 *
 * `resolveRobotoFontPaths()` valida essa invariante na primeira chamada por processo, então
 * qualquer regressão (voltar a usar template, ou um bundler futuro que colapse de novo os
 * assets) falha alto e cedo, em vez de produzir um PDF sutilmente errado.
 */
const FONT_URLS = {
  normal: new URL("./Roboto/Roboto-Regular.ttf", import.meta.url),
  bold: new URL("./Roboto/Roboto-Medium.ttf", import.meta.url),
  italics: new URL("./Roboto/Roboto-Italic.ttf", import.meta.url),
  bolditalics: new URL("./Roboto/Roboto-MediumItalic.ttf", import.meta.url),
} as const;

export interface RobotoFontPaths {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

// Magic numbers sfnt válidos (TrueType/OpenType): 00 01 00 00 | "true" | "OTTO" | "ttcf".
const SFNT_MAGICS: readonly Buffer[] = [
  Buffer.from([0x00, 0x01, 0x00, 0x00]),
  Buffer.from("true", "ascii"),
  Buffer.from("OTTO", "ascii"),
  Buffer.from("ttcf", "ascii"),
];

let cached: RobotoFontPaths | undefined;

/**
 * Resolve os 4 caminhos das fontes Roboto e valida, na primeira chamada do processo, que o
 * bundler não colapsou os assets (ver docblock do módulo). Lança `Error` — não é erro de
 * domínio, é falha de build/infra, não de input do usuário.
 */
export function resolveRobotoFontPaths(): RobotoFontPaths {
  if (cached) return cached;

  const paths: RobotoFontPaths = {
    normal: fileURLToPath(FONT_URLS.normal),
    bold: fileURLToPath(FONT_URLS.bold),
    italics: fileURLToPath(FONT_URLS.italics),
    bolditalics: fileURLToPath(FONT_URLS.bolditalics),
  };

  assertFontsResolvedCorrectly(paths);

  cached = paths;
  return paths;
}

function assertFontsResolvedCorrectly(paths: RobotoFontPaths): void {
  const values = Object.values(paths);

  // 1. O bundler colapsou as 4 chamadas de `new URL` para um único asset.
  if (new Set(values).size !== values.length) {
    throw invalidFontSetup(values[0] ?? "(vazio)", "os 4 caminhos resolveram para o mesmo arquivo");
  }

  for (const path of values) {
    // 2. O "vencedor" do colapso é outro arquivo da pasta (ex.: NOTICE.md).
    if (!path.endsWith(".ttf")) {
      throw invalidFontSetup(path, "o caminho não termina em .ttf");
    }

    // 3. TTF ausente no output, ou presente mas corrompido (ex.: normalização de EOL do git).
    if (!hasValidSfntHeader(path)) {
      throw invalidFontSetup(
        path,
        "o arquivo não existe ou seu cabeçalho não é um magic number sfnt válido (00 01 00 00 / true / OTTO / ttcf)",
      );
    }
  }
}

function hasValidSfntHeader(path: string): boolean {
  const header = Buffer.alloc(4);
  let fd: number;
  try {
    fd = openSync(path, "r");
  } catch {
    // Asset não emitido pelo bundler: mesma família de falha, mesmo diagnóstico.
    return false;
  }
  try {
    readSync(fd, header, 0, 4, 0);
  } finally {
    closeSync(fd);
  }
  return SFNT_MAGICS.some((magic) => header.equals(magic));
}

function invalidFontSetup(path: string, reason: string): Error {
  return new Error(
    `Fontes do pdfmake não resolveram corretamente: ${path} não é um TTF válido (${reason}). ` +
      "Provavelmente o bundler colapsou as 4 chamadas de `new URL` em um único asset — " +
      "confira se cada caminho em roboto-font-paths.ts é uma string literal (nunca um template).",
  );
}
