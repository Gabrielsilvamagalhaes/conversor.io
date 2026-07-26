// Prova real de que o build emitiu as 4 fontes Roboto como assets distintos (não um único
// arquivo colapsado — o bug que motivou `roboto-font-paths.ts`). Varre `.next/` recursivamente
// atrás de arquivos `Roboto-*.ttf` (o bundler adiciona hash ao nome final) e exige pelo menos
// 4 arquivos com CONTEÚDO distinto (comparado por hash do conteúdo, não do nome — dois hashes
// de nome diferentes podem apontar para o mesmo conteúdo se o colapso persistir) e todos com
// um header sfnt válido. Node puro, sem dependências — roda em CI logo após `pnpm build`.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = resolve(root, ".next");
const ROBOTO_FILE_PATTERN = /^Roboto-.*\.ttf$/;
const MIN_DISTINCT_FONTS = 4;

const SFNT_MAGICS = [
  Buffer.from([0x00, 0x01, 0x00, 0x00]),
  Buffer.from("true", "ascii"),
  Buffer.from("OTTO", "ascii"),
  Buffer.from("ttcf", "ascii"),
];

function hasValidSfntHeader(buffer) {
  const header = buffer.subarray(0, 4);
  return SFNT_MAGICS.some((magic) => header.equals(magic));
}

function findRobotoFonts(dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    const entryPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findRobotoFonts(entryPath));
    } else if (entry.isFile() && ROBOTO_FILE_PATTERN.test(entry.name)) {
      found.push(entryPath);
    }
  }
  return found;
}

function fail(message) {
  console.error(`[verify-font-assets] ${message}`);
  process.exit(1);
}

if (!existsSync(nextDir)) {
  fail(
    "a pasta .next/ não existe. Rode `pnpm build` antes de executar este script " +
      "(ele verifica os assets emitidos pelo build, não o código-fonte).",
  );
}

console.log("[verify-font-assets] varrendo .next/ atrás de fontes Roboto emitidas...");

const candidates = findRobotoFonts(nextDir);

if (candidates.length === 0) {
  fail(
    "nenhum arquivo `Roboto-*.ttf` encontrado em .next/. Isso indica que a fonte não foi " +
      "emitida como asset estático — confira se `new URL(...)` em roboto-font-paths.ts " +
      "continua usando caminhos literais.",
  );
}

const byHash = new Map();
for (const path of candidates) {
  const buffer = readFileSync(path);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const relPath = path.slice(root.length + 1);

  if (!hasValidSfntHeader(buffer)) {
    fail(
      `${relPath} não tem um header sfnt válido (00 01 00 00 / true / OTTO / ttcf). ` +
        "O bundler provavelmente colapsou os assets ou o arquivo foi corrompido " +
        "(normalização de EOL do git é uma causa comum — confira .gitattributes).",
    );
  }

  if (!byHash.has(hash)) {
    byHash.set(hash, []);
  }
  byHash.get(hash).push(relPath);
}

console.log(
  `[verify-font-assets] ${candidates.length} arquivo(s) Roboto-*.ttf encontrado(s), ` +
    `${byHash.size} conteúdo(s) distinto(s).`,
);

if (byHash.size < MIN_DISTINCT_FONTS) {
  console.error("[verify-font-assets] conteúdos encontrados (agrupados por hash):");
  for (const [hash, paths] of byHash) {
    console.error(`  ${hash.slice(0, 12)}…: ${paths.join(", ")}`);
  }
  fail(
    `esperava pelo menos ${MIN_DISTINCT_FONTS} fontes Roboto com conteúdo distinto no build, ` +
      `mas encontrei apenas ${byHash.size}. Isso é exatamente o bug que roboto-font-paths.ts ` +
      "existe para prevenir: o bundler colapsou várias chamadas de `new URL` no mesmo asset " +
      "— confira se cada caminho é uma string literal (nunca um template dinâmico).",
  );
}

console.log(
  `[verify-font-assets] OK — ${byHash.size} fontes Roboto distintas, todas com header sfnt válido.`,
);
