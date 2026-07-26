import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type {
  FileTypeDetection,
  FileTypeDetectorPort,
} from "@/domain/conversion/ports/file-type-detector.port";
import {
  type AcceptedExtension,
  isAcceptedExtension,
} from "@/domain/conversion/value-objects/accepted-format";
import { FileName } from "@/domain/conversion/value-objects/file-name";

export interface ValidateUploadInput {
  readonly fileName: string;
  readonly size: number;
  readonly bytes: Uint8Array;
}

export interface ValidatedUpload {
  readonly accepted: true;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly extension: AcceptedExtension;
  readonly message: string;
}

/**
 * Valida um upload: tamanho, allowlist de extensão e coerência entre a extensão e o conteúdo
 * real (magic bytes). O que cada extensão precisa ser está em `EXPECTED_CONTENT`, no fim deste
 * arquivo. Rejeita binários/executáveis disfarçados.
 */
export class ValidateUploadUseCase {
  constructor(
    private readonly detector: FileTypeDetectorPort,
    private readonly maxSizeBytes: number,
  ) {}

  execute(input: ValidateUploadInput): ValidatedUpload {
    if (input.size <= 0) throw new EmptyFileError();
    if (input.size > this.maxSizeBytes) {
      throw new FileTooLargeError(input.size, this.maxSizeBytes);
    }

    const name = FileName.create(input.fileName);
    if (!isAcceptedExtension(name.extension)) {
      throw new InvalidFileTypeError(`extensão ".${name.extension}" não suportada`);
    }

    const detection = this.detector.detect(input.bytes);
    this.assertContentMatchesExtension(name.extension, detection);

    return {
      accepted: true,
      fileName: name.value,
      sizeBytes: input.size,
      extension: name.extension,
      message: "Arquivo recebido e validado.",
    };
  }

  private assertContentMatchesExtension(
    extension: AcceptedExtension,
    detection: FileTypeDetection,
  ): void {
    const expected = EXPECTED_CONTENT[extension];

    switch (expected.kind) {
      case "text": {
        // Formatos de texto: não podem ter assinatura binária conhecida nem byte NUL.
        // `.md` em UTF-16 é rejeitado pelo byte NUL — mesmo comportamento já aceito
        // para `.txt`/`.csv`; conteúdo com BOM UTF-8 passa normalmente.
        if (detection.isBinary || detection.signature !== null) {
          throw new InvalidFileTypeError(
            `conteúdo binário não corresponde a um .${extension} de texto`,
          );
        }
        return;
      }
      case "signature": {
        if (detection.signature !== expected.name) {
          throw new InvalidFileTypeError(
            extension === "pdf"
              ? "conteúdo não corresponde a um documento .pdf"
              : `conteúdo não corresponde a um arquivo .${extension}`,
          );
        }
        return;
      }
      case "reject": {
        throw new InvalidFileTypeError(expected.reason);
      }
    }
  }
}

/**
 * Classificação exaustiva do conteúdo esperado por extensão. O tipo `Record<AcceptedExtension, ...>`
 * é intencional: se alguém adicionar uma extensão a `ACCEPTED_EXTENSIONS` sem classificá-la aqui,
 * o `tsc --noEmit` falha em vez de deixar a extensão cair silenciosamente no comportamento errado
 * (o antigo `else` final exigia assinatura "zip", o que rejeitaria png/jpg/webp/md e já era um
 * bug latente para mp4/mp3/webm/mov/wav, que nunca deveriam chegar a este validador).
 */
type ExpectedContent =
  | { readonly kind: "text" }
  | { readonly kind: "signature"; readonly name: string }
  | { readonly kind: "reject"; readonly reason: string };

const MEDIA_REJECT_REASON =
  "arquivos de mídia são convertidos no navegador (ffmpeg.wasm) e nunca deveriam ser enviados a este endpoint";

const EXPECTED_CONTENT: Record<AcceptedExtension, ExpectedContent> = {
  csv: { kind: "text" },
  json: { kind: "text" },
  txt: { kind: "text" },
  md: { kind: "text" },
  pdf: { kind: "signature", name: "pdf" },
  // .xlsx e .docx são containers OOXML (zip). Indistinguíveis por magic bytes:
  // ambos começam com "PK"; a extensão é confiada além da checagem de zip.
  xlsx: { kind: "signature", name: "zip" },
  docx: { kind: "signature", name: "zip" },
  png: { kind: "signature", name: "png" },
  jpg: { kind: "signature", name: "jpg" },
  webp: { kind: "signature", name: "webp" },
  mp4: { kind: "reject", reason: MEDIA_REJECT_REASON },
  webm: { kind: "reject", reason: MEDIA_REJECT_REASON },
  mov: { kind: "reject", reason: MEDIA_REJECT_REASON },
  mp3: { kind: "reject", reason: MEDIA_REJECT_REASON },
  wav: { kind: "reject", reason: MEDIA_REJECT_REASON },
};
