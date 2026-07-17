import "server-only";
import { ConvertFileUseCase } from "@/application/conversion/convert-file.use-case";
import { PreviewSpreadsheetUseCase } from "@/application/conversion/preview-spreadsheet.use-case";
import { ConverterRegistry } from "@/application/conversion/services/converter-registry";
import { ValidateUploadUseCase } from "@/application/conversion/validate-upload.use-case";
import { CreateSessionUseCase } from "@/application/identity/create-session.use-case";
import { GetSessionUseCase } from "@/application/identity/get-session.use-case";
import { RevokeSessionUseCase } from "@/application/identity/revoke-session.use-case";
import { FirebaseAuthAdapter } from "@/infrastructure/auth/firebase-auth.adapter";
import { CsvToXlsxAdapter } from "@/infrastructure/conversion/converters/csv-to-xlsx.adapter";
import { XlsxToCsvAdapter } from "@/infrastructure/conversion/converters/xlsx-to-csv.adapter";
import { MagicBytesDetector } from "@/infrastructure/conversion/magic-bytes-detector";
import { SpreadsheetReader } from "@/infrastructure/conversion/spreadsheet/spreadsheet-reader";

/**
 * Composition root: instancia os adapters de infraestrutura e injeta nos use cases.
 * Route handlers e Server Components devem consumir os use cases somente daqui.
 * É o único lugar que conhece as implementações concretas.
 */
export interface Container {
  readonly createSession: CreateSessionUseCase;
  readonly getSession: GetSessionUseCase;
  readonly revokeSession: RevokeSessionUseCase;
  readonly validateUpload: ValidateUploadUseCase;
  readonly previewSpreadsheet: PreviewSpreadsheetUseCase;
  readonly convertFile: ConvertFileUseCase;
}

let cached: Container | null = null;

export function getContainer(): Container {
  if (cached) return cached;

  const authSession = new FirebaseAuthAdapter();
  const fileTypeDetector = new MagicBytesDetector();
  const spreadsheetReader = new SpreadsheetReader();
  const converterRegistry = new ConverterRegistry([new CsvToXlsxAdapter(), new XlsxToCsvAdapter()]);

  cached = {
    createSession: new CreateSessionUseCase(authSession),
    getSession: new GetSessionUseCase(authSession),
    revokeSession: new RevokeSessionUseCase(authSession),
    validateUpload: new ValidateUploadUseCase(fileTypeDetector),
    previewSpreadsheet: new PreviewSpreadsheetUseCase(spreadsheetReader),
    convertFile: new ConvertFileUseCase(converterRegistry),
  };
  return cached;
}
