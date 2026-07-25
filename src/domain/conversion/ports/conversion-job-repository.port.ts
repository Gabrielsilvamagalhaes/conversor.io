import type { ConversionJob } from "@/domain/conversion/entities/conversion-job";

/** Página de resultados de `listByUser`, com cursor de paginação (id do último documento). */
export interface ConversionJobPage {
  readonly jobs: readonly ConversionJob[];
  readonly nextCursor: string | null;
}

/** Contagem de conversões num dia (`date` no formato `YYYY-MM-DD`). */
export interface ConversionDayCount {
  readonly date: string;
  readonly count: number;
}

/** Estatísticas agregadas do histórico de um usuário, para o dashboard. */
export interface ConversionStats {
  readonly total: number;
  readonly last30Days: number;
  readonly totalBytes: number;
  readonly topPair: { from: string; to: string; count: number } | null;
  /** Últimos 14 dias, sempre 14 entradas em ordem cronológica crescente (dias sem conversão = 0). */
  readonly byDay: readonly ConversionDayCount[];
}

/**
 * Port do repositório de histórico de conversões. Implementado em infra por
 * `FirestoreConversionJobRepository` (coleção `users/{uid}/conversions`).
 */
export interface ConversionJobRepositoryPort {
  save(job: ConversionJob): Promise<void>;
  listByUser(
    userId: string,
    options: { limit: number; cursor?: string },
  ): Promise<ConversionJobPage>;
  statsByUser(userId: string): Promise<ConversionStats>;
  countByUserSince(userId: string, since: Date): Promise<number>;
}
