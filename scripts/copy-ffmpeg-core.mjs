// Copia o core single-thread do ffmpeg.wasm para `public/ffmpeg/` (self-hosted).
// Rodado em `postinstall`: mantém o binário de ~32 MB fora do git, sempre casando a versão
// instalada de @ffmpeg/core. Self-hosting evita CDN/CSP; single-thread dispensa COOP/COEP.
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(root, "node_modules/@ffmpeg/core/dist/umd");
const outDir = resolve(root, "public/ffmpeg");
const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!existsSync(srcDir)) {
  console.warn("[ffmpeg] @ffmpeg/core não instalado; pulando cópia do core.");
  process.exit(0);
}

await mkdir(outDir, { recursive: true });
for (const file of files) {
  await copyFile(resolve(srcDir, file), resolve(outDir, file));
}
console.log(`[ffmpeg] core copiado para public/ffmpeg/ (${files.join(", ")}).`);
