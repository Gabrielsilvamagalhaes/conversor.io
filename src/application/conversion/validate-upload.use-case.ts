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
 * Valida um upload: tamanho, allowlist de extensão e coerência entre a extensão
 * e o conteúdo real (magic bytes). Formatos de texto (`.csv`, `.json`, `.txt`)
 * devem ser texto; `.xlsx`/`.docx` são containers zip (OOXML); `.pdf` deve começar
 * com `%PDF`. Rejeita binários/executáveis disfarçados.
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
    // Formatos de texto: não podem ter assinatura binária conhecida nem byte NUL.
    if (extension === "csv" || extension === "json" || extension === "txt") {
      if (detection.isBinary || detection.signature !== null) {
        throw new InvalidFileTypeError(
          `conteúdo binário não corresponde a um .${extension} de texto`,
        );
      }
      return;
    }

    // .pdf começa com %PDF.
    if (extension === "pdf") {
      if (detection.signature !== "pdf") {
        throw new InvalidFileTypeError("conteúdo não corresponde a um documento .pdf");
      }
      return;
    }

    // .xlsx e .docx são containers OOXML (zip). Indistinguíveis por magic bytes:
    // ambos começam com "PK"; a extensão é confiada além da checagem de zip.
    if (detection.signature !== "zip") {
      throw new InvalidFileTypeError(`conteúdo não corresponde a um arquivo .${extension}`);
    }
  }
}
