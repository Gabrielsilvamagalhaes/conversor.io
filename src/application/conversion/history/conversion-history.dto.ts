import type { ConversionJob } from "@/domain/conversion/entities/conversion-job";

/**
 * `ConversionJob` achatado e 100% serializável (sem `Date`, sem instância de classe) —
 * atravessa a fronteira Server Component → Client Component do React. `userId` fica de
 * fora de propósito: o cliente já sabe de quem é a própria sessão.
 */
export interface ConversionJobDto {
  readonly id: string;
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
  /** ISO 8601 (`Date` não atravessa a fronteira Server → Client Component). */
  readonly createdAt: string;
  readonly storageKey: string | null;
  /** ISO 8601 ou `null` (reservado para a Fase 3). */
  readonly expiresAt: string | null;
}

export interface ConversionHistoryDto {
  readonly items: readonly ConversionJobDto[];
  readonly nextCursor: string | null;
}

export interface ConversionDayCountDto {
  readonly date: string;
  readonly count: number;
}

export interface ConversionStatsDto {
  readonly total: number;
  readonly last30Days: number;
  readonly totalBytes: number;
  readonly topPair: { from: string; to: string; count: number } | null;
  readonly byDay: readonly ConversionDayCountDto[];
}

/** Mapeia a entidade de domínio para o DTO plano exposto pela camada de aplicação. */
export function toConversionJobDto(job: ConversionJob): ConversionJobDto {
  const snapshot = job.toSnapshot();
  return {
    id: snapshot.id,
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
    createdAt: snapshot.createdAt.toISOString(),
    storageKey: snapshot.storageKey,
    expiresAt: snapshot.expiresAt ? snapshot.expiresAt.toISOString() : null,
  };
}
