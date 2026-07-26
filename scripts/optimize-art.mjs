#!/usr/bin/env node
/**
 * Gera derivados web-ready da arte de domínio público em `public/art/`.
 *
 * Os originais (`*.jpg`, vários MB) ficam versionados como fonte, mas nunca são servidos: a
 * landing referencia os `.webp` gerados aqui. Sem isso o LCP da home carrega ~5,8 MB de JPEG.
 *
 * Uso: `node scripts/optimize-art.mjs`. Idempotente — pode rodar quantas vezes quiser.
 */
import { readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const ART_DIR = join(process.cwd(), "public", "art");
const WIDTHS = [800, 1200, 1600];
const SOURCE_PATTERN = /\.(jpe?g|png)$/i;

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function optimize(fileName) {
  const source = join(ART_DIR, fileName);
  const name = basename(fileName, extname(fileName));
  const { size: originalBytes } = await stat(source);
  const metadata = await sharp(source).metadata();

  const generated = [];
  for (const width of WIDTHS) {
    // Não amplia: uma arte de 1200px de largura não vira um "1600" borrado.
    if (metadata.width && metadata.width < width) continue;
    const target = join(ART_DIR, `${name}-${width}.webp`);
    const info = await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(target);
    generated.push({ width, bytes: info.size });
  }

  console.log(
    `${fileName} (${formatBytes(originalBytes)}) → ${generated
      .map((g) => `${g.width}px ${formatBytes(g.bytes)}`)
      .join(" · ")}`,
  );
}

const entries = await readdir(ART_DIR);
const sources = entries.filter((entry) => SOURCE_PATTERN.test(entry));

if (sources.length === 0) {
  console.error(`Nenhuma arte encontrada em ${ART_DIR}.`);
  process.exit(1);
}

for (const fileName of sources) {
  await optimize(fileName);
}
