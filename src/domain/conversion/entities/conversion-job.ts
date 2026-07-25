import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
import type {
  ConversionCategory,
  ConversionEngine,
} from "@/domain/conversion/value-objects/conversion-pair";

/** Resultado final de uma conversão já executada — não modela estados intermediários. */
export type ConversionStatus = "completed" | "failed";

/** Retrato plano e imutável de um `ConversionJob` — usado pelo mapper de infra e pelos DTOs. */
export interface ConversionJobSnapshot {
  readonly id: string;
  readonly userId: string;
  readonly displayName: string;
  readonly fileNameHash: string;
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  readonly category: ConversionCategory;
  readonly engine: ConversionEngine;
  readonly sizeBytes: number;
  readonly outputSizeBytes: number | null;
  readonly status: ConversionStatus;
  readonly durationMs: number;
  readonly errorCode: string | null;
  readonly createdAt: Date;
  readonly storageKey: string | null;
  readonly expiresAt: Date | null;
}

interface BaseConversionJobInput {
  readonly userId: string;
  /** Nome legível do arquivo de entrada, fornecido pelo próprio usuário. */
  readonly displayName: string;
  /** sha256[0..12) do nome de arquivo — o que vai para log, nunca `displayName`. */
  readonly fileNameHash: string;
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  readonly category: ConversionCategory;
  readonly engine: ConversionEngine;
  readonly sizeBytes: number;
  readonly durationMs: number;
  /** Injetável para determinismo em teste; default `crypto.randomUUID()`. */
  readonly id?: string;
  /** Injetável para determinismo em teste; default `new Date()`. */
  readonly createdAt?: Date;
}

export interface CompletedConversionJobInput extends BaseConversionJobInput {
  readonly outputSizeBytes: number;
}

export interface FailedConversionJobInput extends BaseConversionJobInput {
  readonly errorCode: string;
}

/**
 * Agregado raiz do histórico de conversões. Registra o resultado (sucesso ou falha) de uma
 * conversão que já foi executada em memória — não modela um ciclo de vida `pending`/`processing`,
 * porque o fluxo de conversão atual é síncrono (ver ADR "Storage Temporário e TTL").
 *
 * `storageKey`/`expiresAt` são reservados para a Fase 3 (download assíncrono + storage
 * temporário com TTL); hoje são sempre `null`.
 */
export class ConversionJob {
  readonly id: string;
  readonly userId: string;
  readonly displayName: string;
  readonly fileNameHash: string;
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  readonly category: ConversionCategory;
  readonly engine: ConversionEngine;
  readonly sizeBytes: number;
  readonly outputSizeBytes: number | null;
  readonly status: ConversionStatus;
  readonly durationMs: number;
  readonly errorCode: string | null;
  readonly createdAt: Date;
  readonly storageKey: string | null;
  readonly expiresAt: Date | null;

  private constructor(props: ConversionJobSnapshot) {
    ConversionJob.validate(props);

    this.id = props.id;
    this.userId = props.userId;
    this.displayName = props.displayName;
    this.fileNameHash = props.fileNameHash;
    this.from = props.from;
    this.to = props.to;
    this.category = props.category;
    this.engine = props.engine;
    this.sizeBytes = props.sizeBytes;
    this.outputSizeBytes = props.outputSizeBytes;
    this.status = props.status;
    this.durationMs = props.durationMs;
    this.errorCode = props.errorCode;
    this.createdAt = props.createdAt;
    this.storageKey = props.storageKey;
    this.expiresAt = props.expiresAt;
  }

  private static validate(props: ConversionJobSnapshot): void {
    if (props.userId.trim().length === 0) {
      throw new Error("ConversionJob inválido: userId não pode ser vazio.");
    }
    if (props.sizeBytes < 0) {
      throw new Error("ConversionJob inválido: sizeBytes não pode ser negativo.");
    }
    if (props.durationMs < 0) {
      throw new Error("ConversionJob inválido: durationMs não pode ser negativo.");
    }

    if (props.status === "completed") {
      if (props.outputSizeBytes === null) {
        throw new Error("ConversionJob concluído exige outputSizeBytes.");
      }
      if (props.errorCode !== null) {
        throw new Error("ConversionJob concluído não pode ter errorCode.");
      }
    } else {
      if (!props.errorCode || props.errorCode.trim().length === 0) {
        throw new Error("ConversionJob com falha exige errorCode.");
      }
      if (props.outputSizeBytes !== null) {
        throw new Error("ConversionJob com falha não pode ter outputSizeBytes.");
      }
    }
  }

  static completed(input: CompletedConversionJobInput): ConversionJob {
    return new ConversionJob({
      id: input.id ?? crypto.randomUUID(),
      userId: input.userId,
      displayName: input.displayName,
      fileNameHash: input.fileNameHash,
      from: input.from,
      to: input.to,
      category: input.category,
      engine: input.engine,
      sizeBytes: input.sizeBytes,
      outputSizeBytes: input.outputSizeBytes,
      status: "completed",
      durationMs: input.durationMs,
      errorCode: null,
      createdAt: input.createdAt ?? new Date(),
      storageKey: null,
      expiresAt: null,
    });
  }

  static failed(input: FailedConversionJobInput): ConversionJob {
    return new ConversionJob({
      id: input.id ?? crypto.randomUUID(),
      userId: input.userId,
      displayName: input.displayName,
      fileNameHash: input.fileNameHash,
      from: input.from,
      to: input.to,
      category: input.category,
      engine: input.engine,
      sizeBytes: input.sizeBytes,
      outputSizeBytes: null,
      status: "failed",
      durationMs: input.durationMs,
      errorCode: input.errorCode,
      createdAt: input.createdAt ?? new Date(),
      storageKey: null,
      expiresAt: null,
    });
  }

  toSnapshot(): ConversionJobSnapshot {
    return {
      id: this.id,
      userId: this.userId,
      displayName: this.displayName,
      fileNameHash: this.fileNameHash,
      from: this.from,
      to: this.to,
      category: this.category,
      engine: this.engine,
      sizeBytes: this.sizeBytes,
      outputSizeBytes: this.outputSizeBytes,
      status: this.status,
      durationMs: this.durationMs,
      errorCode: this.errorCode,
      createdAt: this.createdAt,
      storageKey: this.storageKey,
      expiresAt: this.expiresAt,
    };
  }
}
