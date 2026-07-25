import { Timestamp } from "firebase-admin/firestore";
import { ConversionJob, type ConversionStatus } from "@/domain/conversion/entities/conversion-job";
import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
import type {
  ConversionCategory,
  ConversionEngine,
} from "@/domain/conversion/value-objects/conversion-pair";

/** Formato persistido em `users/{uid}/conversions/{jobId}`. */
export interface ConversionJobDocument {
  readonly userId: string;
  readonly displayName: string;
  readonly fileNameHash: string;
  readonly from: string;
  readonly to: string;
  readonly category: string;
  readonly engine: string;
  readonly sizeBytes: number;
  readonly outputSizeBytes: number | null;
  readonly status: string;
  readonly durationMs: number;
  readonly errorCode: string | null;
  readonly createdAt: Timestamp;
  readonly storageKey: string | null;
  readonly expiresAt: Timestamp | null;
}

/** Duck-type de `Timestamp` — permite testar com um fake mínimo, sem depender do emulador. */
interface TimestampLike {
  toDate(): Date;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function corrupted(field: string, reason = "ausente ou com tipo inválido"): never {
  throw new Error(`Documento de conversão corrompido: campo "${field}" ${reason}.`);
}

function requireString(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || value.length === 0) corrupted(field);
  return value;
}

function requireNumber(data: Record<string, unknown>, field: string): number {
  const value = data[field];
  if (typeof value !== "number" || Number.isNaN(value)) corrupted(field);
  return value;
}

function requireNullableNumber(data: Record<string, unknown>, field: string): number | null {
  const value = data[field];
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || Number.isNaN(value)) corrupted(field);
  return value;
}

function requireNullableString(data: Record<string, unknown>, field: string): string | null {
  const value = data[field];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") corrupted(field);
  return value;
}

function requireTimestamp(data: Record<string, unknown>, field: string): Date {
  const value = data[field];
  if (!isTimestampLike(value)) corrupted(field, "não é um Timestamp válido");
  return value.toDate();
}

function requireNullableTimestamp(data: Record<string, unknown>, field: string): Date | null {
  const value = data[field];
  if (value === null || value === undefined) return null;
  if (!isTimestampLike(value)) corrupted(field, "não é um Timestamp válido");
  return value.toDate();
}

function requireStatus(data: Record<string, unknown>, field: string): ConversionStatus {
  const value = data[field];
  if (value !== "completed" && value !== "failed") corrupted(field);
  return value;
}

/** Serializa um `ConversionJob` para o formato persistido no Firestore. */
export function toDocument(job: ConversionJob): ConversionJobDocument {
  const snapshot = job.toSnapshot();
  return {
    userId: snapshot.userId,
    displayName: snapshot.displayName,
    fileNameHash: snapshot.fileNameHash,
    from: snapshot.from,
    to: snapshot.to,
    category: snapshot.category,
    engine: snapshot.engine,
    sizeBytes: snapshot.sizeBytes,
    outputSizeBytes: snapshot.outputSizeBytes,
    status: snapshot.status,
    durationMs: snapshot.durationMs,
    errorCode: snapshot.errorCode,
    createdAt: Timestamp.fromDate(snapshot.createdAt),
    storageKey: snapshot.storageKey,
    expiresAt: snapshot.expiresAt ? Timestamp.fromDate(snapshot.expiresAt) : null,
  };
}

/**
 * Reconstrói um `ConversionJob` a partir de um documento do Firestore, validando o
 * shape campo a campo. Delega a validação de invariantes de negócio (ex.: `completed`
 * exige `outputSizeBytes`) para as factories da entidade — um documento corrompido
 * lança erro tanto por shape inválido quanto por invariante de domínio violada.
 */
export function fromDocument(id: string, data: Record<string, unknown>): ConversionJob {
  const status = requireStatus(data, "status");
  const base = {
    id,
    userId: requireString(data, "userId"),
    displayName: requireString(data, "displayName"),
    fileNameHash: requireString(data, "fileNameHash"),
    from: requireString(data, "from") as AcceptedExtension,
    to: requireString(data, "to") as AcceptedExtension,
    category: requireString(data, "category") as ConversionCategory,
    engine: requireString(data, "engine") as ConversionEngine,
    sizeBytes: requireNumber(data, "sizeBytes"),
    durationMs: requireNumber(data, "durationMs"),
    createdAt: requireTimestamp(data, "createdAt"),
  };

  // storageKey/expiresAt são reservados para a Fase 3; validados mas não usados ainda.
  requireNullableString(data, "storageKey");
  requireNullableTimestamp(data, "expiresAt");

  if (status === "completed") {
    const outputSizeBytes = requireNullableNumber(data, "outputSizeBytes");
    if (outputSizeBytes === null)
      corrupted("outputSizeBytes", "é obrigatório quando status=completed");
    return ConversionJob.completed({ ...base, outputSizeBytes });
  }

  const errorCode = requireNullableString(data, "errorCode");
  if (errorCode === null) corrupted("errorCode", "é obrigatório quando status=failed");
  return ConversionJob.failed({ ...base, errorCode });
}
