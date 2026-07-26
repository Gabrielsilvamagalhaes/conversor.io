import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveRobotoFontPaths } from "@/infrastructure/conversion/docx/fonts/roboto-font-paths";

const SFNT_MAGICS = [
  Buffer.from([0x00, 0x01, 0x00, 0x00]),
  Buffer.from("true", "ascii"),
  Buffer.from("OTTO", "ascii"),
  Buffer.from("ttcf", "ascii"),
];

function hasValidSfntHeader(path: string): boolean {
  const header = readFileSync(path).subarray(0, 4);
  return SFNT_MAGICS.some((magic) => header.equals(magic));
}

describe("resolveRobotoFontPaths", () => {
  it("devolve 4 caminhos distintos, todos .ttf, todos existindo em disco com header sfnt válido", () => {
    const paths = resolveRobotoFontPaths();
    const values = Object.values(paths);

    expect(new Set(values).size).toBe(4);

    for (const path of values) {
      expect(path.endsWith(".ttf")).toBe(true);
      expect(statSync(path).isFile()).toBe(true);
      expect(hasValidSfntHeader(path)).toBe(true);
    }
  });
});

describe("guard de forma do código-fonte de roboto-font-paths.ts", () => {
  // Isto NÃO é um teste de comportamento — é uma regra de lint expressa como teste.
  // A regressão que este módulo existe para prevenir (template dinâmico em `new URL` faz o
  // bundler colapsar os 4 assets em 1) só se manifesta sob Turbopack/webpack; o Vitest roda
  // sem bundler no caminho, então não tem como pegá-la em runtime. Ler o texto-fonte e proibir
  // qualquer `new URL(` cujo primeiro argumento não seja uma string literal com aspas é a
  // única forma barata de travar essa regra em CI antes do build.
  it("não contém nenhum `new URL(` com template dinâmico (`` ` `` ou `${`) no primeiro argumento", () => {
    const sourcePath = fileURLToPath(new URL("./roboto-font-paths.ts", import.meta.url));
    const source = readFileSync(sourcePath, "utf-8");

    // Remove comentários de bloco e de linha antes de escanear: o docblock do próprio módulo
    // cita `new URL(caminho, ...)` como exemplo de prosa, o que daria falso positivo se
    // comentários entrassem na varredura.
    const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    const newUrlCalls = [...codeOnly.matchAll(/new URL\(([^,]+),/g)].map((match) => match[1]);

    expect(newUrlCalls.length).toBeGreaterThan(0);

    for (const firstArg of newUrlCalls) {
      expect(firstArg.includes("`")).toBe(false);
      expect(firstArg.includes("${")).toBe(false);
      expect(/^\s*["']/.test(firstArg)).toBe(true);
    }
  });
});
