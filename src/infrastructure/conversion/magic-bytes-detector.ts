import type {
  FileTypeDetection,
  FileTypeDetectorPort,
} from "@/domain/conversion/ports/file-type-detector.port";

interface Signature {
  readonly name: string;
  readonly magic: readonly number[];
}

/** Assinaturas binárias comuns que NUNCA devem se passar por um .csv. */
const SIGNATURES: readonly Signature[] = [
  { name: "zip", magic: [0x50, 0x4b] }, // PK (zip/xlsx/docx)
  { name: "pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { name: "exe", magic: [0x4d, 0x5a] }, // MZ
  { name: "elf", magic: [0x7f, 0x45, 0x4c, 0x46] }, // .ELF
  { name: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { name: "gif", magic: [0x47, 0x49, 0x46] }, // GIF
  { name: "jpg", magic: [0xff, 0xd8, 0xff] },
];

/** Null-byte scan is limited to the first 512 bytes; magic signatures are always at offset 0. Content beyond this limit is not inspected. */
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
      if (sig.magic.every((byte, i) => bytes[i] === byte)) return sig.name;
    }
    return null;
  }

  private hasNullByte(bytes: Uint8Array): boolean {
    const limit = Math.min(bytes.length, SCAN_LIMIT);
    for (let i = 0; i < limit; i++) {
      if (bytes[i] === 0x00) return true;
    }
    return false;
  }
}
