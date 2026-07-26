import type {
  FileTypeDetection,
  FileTypeDetectorPort,
} from "@/domain/conversion/ports/file-type-detector.port";

/** Um trecho de bytes que precisa casar em um offset específico do arquivo. */
interface SignatureSegment {
  readonly offset: number;
  readonly magic: readonly number[];
}

interface Signature {
  readonly name: string;
  readonly segments: readonly SignatureSegment[];
}

/**
 * Assinaturas binárias comuns que NUNCA devem se passar por um .csv.
 * Cada assinatura é uma lista de segmentos (offset + bytes); todos os segmentos
 * precisam casar para a assinatura ser considerada um match. Isso é necessário para
 * `webp`: `RIFF` sozinho no offset 0 não basta (WAV e AVI também são containers RIFF),
 * então webp exige `RIFF` no offset 0 *e* `WEBP` no offset 8.
 */
const SIGNATURES: readonly Signature[] = [
  { name: "zip", segments: [{ offset: 0, magic: [0x50, 0x4b] }] }, // PK (zip/xlsx/docx)
  { name: "pdf", segments: [{ offset: 0, magic: [0x25, 0x50, 0x44, 0x46] }] }, // %PDF
  { name: "exe", segments: [{ offset: 0, magic: [0x4d, 0x5a] }] }, // MZ
  { name: "elf", segments: [{ offset: 0, magic: [0x7f, 0x45, 0x4c, 0x46] }] }, // .ELF
  { name: "png", segments: [{ offset: 0, magic: [0x89, 0x50, 0x4e, 0x47] }] },
  { name: "gif", segments: [{ offset: 0, magic: [0x47, 0x49, 0x46] }] }, // GIF
  { name: "jpg", segments: [{ offset: 0, magic: [0xff, 0xd8, 0xff] }] },
  {
    name: "webp",
    segments: [
      { offset: 0, magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF
      { offset: 8, magic: [0x57, 0x45, 0x42, 0x50] }, // WEBP
    ],
  },
];

/**
 * A varredura de byte NUL olha só os primeiros 512 bytes — conteúdo além disso não é inspecionado.
 * As assinaturas não dependem deste limite: têm offset próprio (todas em 0, exceto o segundo
 * segmento do webp, em 8).
 */
const SCAN_LIMIT = 512;

/**
 * Detecta o tipo real de um arquivo a partir dos primeiros bytes (não confia na extensão).
 * Heurística: detecção de byte NUL limitada aos primeiros 512 bytes.
 */
export class MagicBytesDetector implements FileTypeDetectorPort {
  detect(bytes: Uint8Array): FileTypeDetection {
    const signature = this.matchSignature(bytes);
    const isBinary = signature !== null || this.hasNullByte(bytes);
    return { isBinary, signature };
  }

  private matchSignature(bytes: Uint8Array): string | null {
    for (const sig of SIGNATURES) {
      if (this.matchesAllSegments(bytes, sig.segments)) return sig.name;
    }
    return null;
  }

  private matchesAllSegments(bytes: Uint8Array, segments: readonly SignatureSegment[]): boolean {
    return segments.every((segment) =>
      segment.magic.every((byte, i) => bytes[segment.offset + i] === byte),
    );
  }

  private hasNullByte(bytes: Uint8Array): boolean {
    const limit = Math.min(bytes.length, SCAN_LIMIT);
    for (let i = 0; i < limit; i++) {
      if (bytes[i] === 0x00) return true;
    }
    return false;
  }
}
