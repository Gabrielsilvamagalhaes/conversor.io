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
import { MAX_DOCUMENT_SIZE_BYTES } from "@/shared/constants/upload";

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
 * e o conteúdo real (magic bytes). `.csv` deve ser texto; `.xlsx` deve ser um
 * container zip. Rejeita binários/executáveis disfarçados.
 */
export class ValidateUploadUseCase {
  constructor(private readonly detector: FileTypeDetectorPort) {}

  execute(input: ValidateUploadInput): ValidatedUpload {
    if (input.size <= 0) throw new EmptyFileError();
    if (input.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new FileTooLargeError(input.size, MAX_DOCUMENT_SIZE_BYTES);
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
    if (extension === "csv") {
      if (detection.isBinary || detection.signature !== null) {
        throw new InvalidFileTypeError("conteúdo binário não corresponde a um .csv de texto");
      }
      return;
    }

    // .xlsx é um container OOXML (zip).
    if (detection.signature !== "zip") {
      throw new InvalidFileTypeError("conteúdo não corresponde a uma planilha .xlsx");
    }
  }
}
