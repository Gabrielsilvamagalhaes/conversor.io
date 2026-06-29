import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileTypeDetectorPort } from "@/domain/conversion/ports/file-type-detector.port";
import { isAcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
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
  readonly extension: string;
  readonly message: string;
}

/**
 * Recebe e valida um upload (sem conversão nesta fase): tamanho, allowlist de
 * extensão e rejeição de binários/executáveis disfarçados via FileTypeDetectorPort.
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
    if (detection.isBinary || detection.signature !== null) {
      throw new InvalidFileTypeError("conteúdo binário não corresponde a um .csv de texto");
    }

    return {
      accepted: true,
      fileName: name.value,
      sizeBytes: input.size,
      extension: name.extension,
      message: "Arquivo recebido e validado. A conversão chega na próxima fase.",
    };
  }
}
