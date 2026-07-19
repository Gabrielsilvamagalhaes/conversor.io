import "server-only";
import { GetConversionCatalogUseCase } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { ConvertFileUseCase } from "@/application/conversion/convert-file.use-case";
import { PreviewJsonUseCase } from "@/application/conversion/preview-json.use-case";
import { PreviewPdfUseCase } from "@/application/conversion/preview-pdf.use-case";
import { PreviewSpreadsheetUseCase } from "@/application/conversion/preview-spreadsheet.use-case";
import { ConverterRegistry } from "@/application/conversion/services/converter-registry";
import { ValidateUploadUseCase } from "@/application/conversion/validate-upload.use-case";
import { CreateSessionUseCase } from "@/application/identity/create-session.use-case";
import { GetSessionUseCase } from "@/application/identity/get-session.use-case";
import { RevokeSessionUseCase } from "@/application/identity/revoke-session.use-case";
import { loadUploadConfig } from "@/di/env";
import { FirebaseAuthAdapter } from "@/infrastructure/auth/firebase-auth.adapter";
import { CsvToJsonAdapter } from "@/infrastructure/conversion/converters/csv-to-json.adapter";
import { CsvToXlsxAdapter } from "@/infrastructure/conversion/converters/csv-to-xlsx.adapter";
import { JsonToCsvAdapter } from "@/infrastructure/conversion/converters/json-to-csv.adapter";
import { PdfToTxtAdapter } from "@/infrastructure/conversion/converters/pdf-to-txt.adapter";
import { XlsxToCsvAdapter } from "@/infrastructure/conversion/converters/xlsx-to-csv.adapter";
import { JsonReader } from "@/infrastructure/conversion/json/json-reader";
import { MagicBytesDetector } from "@/infrastructure/conversion/magic-bytes-detector";
import { UnpdfPdfReader } from "@/infrastructure/conversion/pdf/unpdf-pdf-reader";
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
  readonly previewPdf: PreviewPdfUseCase;
  readonly previewJson: PreviewJsonUseCase;
  readonly convertFile: ConvertFileUseCase;
  readonly getConversionCatalog: GetConversionCatalogUseCase;
}

let cached: Container | null = null;

export function getContainer(): Container {
  if (cached) return cached;

  const uploadConfig = loadUploadConfig();
  const authSession = new FirebaseAuthAdapter();
  const fileTypeDetector = new MagicBytesDetector();
  const spreadsheetReader = new SpreadsheetReader();
  const pdfReader = new UnpdfPdfReader();
  const jsonReader = new JsonReader();
  const converterRegistry = new ConverterRegistry([
    new CsvToXlsxAdapter(),
    new XlsxToCsvAdapter(),
    new CsvToJsonAdapter(),
    new JsonToCsvAdapter(),
    new PdfToTxtAdapter(),
  ]);

  cached = {
    createSession: new CreateSessionUseCase(authSession),
    getSession: new GetSessionUseCase(authSession),
    revokeSession: new RevokeSessionUseCase(authSession),
    validateUpload: new ValidateUploadUseCase(fileTypeDetector, uploadConfig.maxDocumentSizeBytes),
    previewSpreadsheet: new PreviewSpreadsheetUseCase(spreadsheetReader),
    previewPdf: new PreviewPdfUseCase(pdfReader),
    previewJson: new PreviewJsonUseCase(jsonReader),
    convertFile: new ConvertFileUseCase(converterRegistry),
    getConversionCatalog: new GetConversionCatalogUseCase(uploadConfig.maxDocumentSizeMb),
  };
  return cached;
}
