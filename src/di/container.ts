import "server-only";
import { GetConversionCatalogUseCase } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { ConvertFileUseCase } from "@/application/conversion/convert-file.use-case";
import { CountConversionsSinceUseCase } from "@/application/conversion/history/count-conversions-since.use-case";
import { GetConversionStatsUseCase } from "@/application/conversion/history/get-conversion-stats.use-case";
import { ListConversionsUseCase } from "@/application/conversion/history/list-conversions.use-case";
import { RecordConversionUseCase } from "@/application/conversion/history/record-conversion.use-case";
import { PreviewDocxUseCase } from "@/application/conversion/preview-docx.use-case";
import { PreviewJsonUseCase } from "@/application/conversion/preview-json.use-case";
import { PreviewPdfUseCase } from "@/application/conversion/preview-pdf.use-case";
import { PreviewSpreadsheetUseCase } from "@/application/conversion/preview-spreadsheet.use-case";
import { ValidateUploadUseCase } from "@/application/conversion/validate-upload.use-case";
import { CreateSessionUseCase } from "@/application/identity/create-session.use-case";
import { GetSessionUseCase } from "@/application/identity/get-session.use-case";
import { RevokeSessionUseCase } from "@/application/identity/revoke-session.use-case";
import { buildConverterRegistry } from "@/di/converters";
import { loadUploadConfig } from "@/di/env";
import type { LoggerPort } from "@/domain/observability/ports/logger.port";
import { FirebaseAuthAdapter } from "@/infrastructure/auth/firebase-auth.adapter";
import { MammothDocxReader } from "@/infrastructure/conversion/docx/mammoth-docx-reader";
import { JsonReader } from "@/infrastructure/conversion/json/json-reader";
import { MagicBytesDetector } from "@/infrastructure/conversion/magic-bytes-detector";
import { UnpdfPdfReader } from "@/infrastructure/conversion/pdf/unpdf-pdf-reader";
import { SpreadsheetReader } from "@/infrastructure/conversion/spreadsheet/spreadsheet-reader";
import { ConsoleJsonLogger } from "@/infrastructure/observability/console-json-logger";
import { getFirestoreDb } from "@/infrastructure/persistence/firestore/firestore-client";
import { FirestoreConversionJobRepository } from "@/infrastructure/persistence/firestore/firestore-conversion-job.repository";

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
  readonly previewDocx: PreviewDocxUseCase;
  readonly convertFile: ConvertFileUseCase;
  readonly getConversionCatalog: GetConversionCatalogUseCase;
  readonly recordConversion: RecordConversionUseCase;
  readonly listConversions: ListConversionsUseCase;
  readonly getConversionStats: GetConversionStatsUseCase;
  readonly countConversionsSince: CountConversionsSinceUseCase;
  /** Logger base (sem bindings de request) — rotas derivam com `.child({ requestId, ... })`. */
  readonly logger: LoggerPort;
}

let cached: Container | null = null;

export function getContainer(): Container {
  if (cached) return cached;

  const logger: LoggerPort = new ConsoleJsonLogger();
  const uploadConfig = loadUploadConfig();
  const authSession = new FirebaseAuthAdapter(logger);
  const fileTypeDetector = new MagicBytesDetector();
  const spreadsheetReader = new SpreadsheetReader();
  const pdfReader = new UnpdfPdfReader();
  const jsonReader = new JsonReader();
  const docxReader = new MammothDocxReader();
  const converterRegistry = buildConverterRegistry();

  // `getFirestoreDb` é passada como referência (não chamada aqui). A inicialização do
  // Firebase Admin só pode acontecer em runtime, com o env validado — o `next build` roda
  // sem os segredos do Firebase e não pode disparar essa inicialização durante a construção
  // do container. O repositório resolve e memoiza a instância na primeira chamada de método.
  const conversionJobRepository = new FirestoreConversionJobRepository(getFirestoreDb);

  cached = {
    createSession: new CreateSessionUseCase(authSession),
    getSession: new GetSessionUseCase(authSession, logger),
    revokeSession: new RevokeSessionUseCase(authSession),
    validateUpload: new ValidateUploadUseCase(fileTypeDetector, uploadConfig.maxDocumentSizeBytes),
    previewSpreadsheet: new PreviewSpreadsheetUseCase(spreadsheetReader),
    previewPdf: new PreviewPdfUseCase(pdfReader),
    previewJson: new PreviewJsonUseCase(jsonReader),
    previewDocx: new PreviewDocxUseCase(docxReader),
    convertFile: new ConvertFileUseCase(converterRegistry),
    getConversionCatalog: new GetConversionCatalogUseCase(uploadConfig.maxDocumentSizeMb),
    recordConversion: new RecordConversionUseCase(conversionJobRepository, logger),
    listConversions: new ListConversionsUseCase(conversionJobRepository),
    getConversionStats: new GetConversionStatsUseCase(conversionJobRepository),
    countConversionsSince: new CountConversionsSinceUseCase(conversionJobRepository),
    logger,
  };
  return cached;
}
