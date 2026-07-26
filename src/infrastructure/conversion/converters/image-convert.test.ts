import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { ImageExtension } from "@/domain/conversion/value-objects/accepted-format";
import { ImageConvertAdapter } from "./image-convert.adapter";

const WIDTH = 8;
const HEIGHT = 6;

/** Gera uma imagem sólida (sem alpha) de teste no formato pedido, via sharp `create`. */
async function makeOpaqueImage(format: ImageExtension): Promise<Uint8Array> {
  const image = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 10, g: 120, b: 200 },
    },
  });

  const buffer =
    format === "jpg"
      ? await image.jpeg().toBuffer()
      : format === "png"
        ? await image.png().toBuffer()
        : await image.webp().toBuffer();

  return new Uint8Array(buffer);
}

/** PNG totalmente transparente (alpha = 0 em todos os pixels). */
async function makeTransparentPng(): Promise<Uint8Array> {
  const buffer = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buffer);
}

function hasMagicBytes(bytes: Uint8Array, to: ImageExtension): boolean {
  if (to === "jpg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (to === "png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  // webp: "RIFF" no offset 0 e "WEBP" no offset 8.
  const riff = new TextDecoder("ascii").decode(bytes.slice(0, 4));
  const webp = new TextDecoder("ascii").decode(bytes.slice(8, 12));
  return riff === "RIFF" && webp === "WEBP";
}

const PAIRS: ReadonlyArray<readonly [ImageExtension, ImageExtension]> = [
  ["png", "jpg"],
  ["jpg", "png"],
  ["webp", "png"],
  ["webp", "jpg"],
  ["png", "webp"],
  ["jpg", "webp"],
];

describe("ImageConvertAdapter (integração, round-trip via sharp)", () => {
  it.each(PAIRS)("%s → %s: magic bytes corretos e dimensões preservadas", async (from, to) => {
    const source = await makeOpaqueImage(from);
    const adapter = new ImageConvertAdapter(from, to);

    const out = await adapter.convert(source);

    expect(hasMagicBytes(out, to)).toBe(true);

    const metadata = await sharp(Buffer.from(out)).metadata();
    expect(metadata.width).toBe(WIDTH);
    expect(metadata.height).toBe(HEIGHT);
  });

  // Regressão do `.flatten()` no sharp-encoder: sem ele, o alpha vira preto no jpg (composição
  // padrão do sharp sobre fundo preto), não branco como o usuário espera.
  it("png totalmente transparente convertido para jpg vira fundo branco (não preto)", async () => {
    const transparentPng = await makeTransparentPng();
    const adapter = new ImageConvertAdapter("png", "jpg");

    const out = await adapter.convert(transparentPng);

    const { data, info } = await sharp(Buffer.from(out))
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info.channels).toBe(3); // jpg não tem canal alpha.

    for (let i = 0; i < data.length; i += info.channels) {
      expect(data[i]).toBe(255);
      expect(data[i + 1]).toBe(255);
      expect(data[i + 2]).toBe(255);
    }
  });

  it("bytes que não são uma imagem válida viram InvalidFileTypeError", async () => {
    const garbage = new TextEncoder().encode("isto claramente não é uma imagem");
    const adapter = new ImageConvertAdapter("png", "jpg");

    await expect(adapter.convert(garbage)).rejects.toThrow(InvalidFileTypeError);
  });
});
