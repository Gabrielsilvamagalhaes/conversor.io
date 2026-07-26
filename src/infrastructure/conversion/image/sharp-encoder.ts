import sharp from "sharp";
import type { ImageExtension } from "@/domain/conversion/value-objects/accepted-format";

/**
 * Decodifica os bytes de origem com sharp e re-codifica no formato de destino.
 *
 * Duas etapas do pipeline não são óbvias e, se removidas, geram bug visível:
 * - `.rotate()`: sem argumentos, aplica a orientação gravada no EXIF (comum em fotos de
 *   celular) e então descarta essa tag. Sem essa chamada, a imagem de saída ignora o EXIF
 *   e pode sair deitada/de cabeça para baixo mesmo que o arquivo original parecesse correto
 *   nos visualizadores que respeitam EXIF.
 * - `.flatten({ background: "#ffffff" })`: só é aplicado quando o destino é `jpg`, que não
 *   tem canal alpha. Sem achatar antes, o sharp descarta o alpha na conversão e a área antes
 *   transparente vira PRETA no jpg (o comportamento padrão de composição sobre preto), em vez
 *   do branco que o usuário normalmente espera.
 *
 * Observação de privacidade: o sharp **remove metadados (EXIF/GPS) por padrão** ao
 * re-codificar — não chamamos `.withMetadata()` de propósito, então dados de localização
 * embutidos na foto original não vazam para o arquivo convertido.
 *
 * Não há timeout/limite adicional de decompression bomb aqui: o teto de upload do produto é
 * 4 MB e o `limitInputPixels` padrão do sharp (~268 megapixels) já cobre esse risco.
 */
export async function encodeImage(bytes: Uint8Array, to: ImageExtension): Promise<Uint8Array> {
  const image = sharp(Buffer.from(bytes), { failOn: "error" }).rotate();

  switch (to) {
    case "jpg":
      return image
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    case "png":
      return image.png({ compressionLevel: 9 }).toBuffer();
    case "webp":
      return image.webp({ quality: 82 }).toBuffer();
  }
}
