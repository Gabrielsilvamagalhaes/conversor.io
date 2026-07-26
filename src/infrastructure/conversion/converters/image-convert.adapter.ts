import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import type { ImageExtension } from "@/domain/conversion/value-objects/accepted-format";
import { encodeImage } from "@/infrastructure/conversion/image/sharp-encoder";

/**
 * Adapter parametrizado para os 6 pares da categoria `images` (`png`/`jpg`/`webp` entre si).
 *
 * Isto é uma exceção deliberada à regra "cada par de conversão = um adapter" do projeto:
 * os 6 pares são a mesma operação (decodificar com sharp → recodificar no formato de saída),
 * variando apenas o codec de destino. Seis classes idênticas exceto por `from`/`to` seriam
 * duplicação, não clareza — o `ConverterRegistry` continua enxergando 6 chaves distintas
 * (`${from}->${to}`) porque `from`/`to` são campos de instância, e o `FileConverterPort`
 * já os declara como `readonly` (não literal types), então os parâmetros de construtor
 * satisfazem o contrato normalmente.
 */
export class ImageConvertAdapter implements FileConverterPort {
  constructor(
    readonly from: ImageExtension,
    readonly to: ImageExtension,
  ) {}

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    try {
      return await encodeImage(bytes, this.to);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new InvalidFileTypeError(`não foi possível ler o arquivo de imagem (${reason}).`);
    }
  }
}
