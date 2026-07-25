import { createHash } from "node:crypto";
import { ConversionJob } from "@/domain/conversion/entities/conversion-job";
import type { ConversionJobRepositoryPort } from "@/domain/conversion/ports/conversion-job-repository.port";
import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
import type {
  ConversionCategory,
  ConversionEngine,
} from "@/domain/conversion/value-objects/conversion-pair";
import type { LoggerPort } from "@/domain/observability/ports/logger.port";

interface BaseRecordConversionInput {
  readonly userId: string;
  readonly fileName: string;
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  readonly category: ConversionCategory;
  readonly engine: ConversionEngine;
  readonly sizeBytes: number;
  readonly durationMs: number;
}

/**
 * Discriminada por `status`, espelhando as factories `completed`/`failed` de
 * `ConversionJob`: uma conversão concluída sempre tem `outputSizeBytes`, uma
 * conversão com falha sempre tem `errorCode` — nunca os dois nem nenhum dos dois.
 */
export type RecordConversionInput =
  | (BaseRecordConversionInput & { readonly status: "completed"; readonly outputSizeBytes: number })
  | (BaseRecordConversionInput & { readonly status: "failed"; readonly errorCode: string });

/**
 * Registra o resultado de uma conversão já executada no histórico do usuário.
 *
 * `fileNameHash` é calculado aqui (não na entidade) com `node:crypto` — biblioteca
 * padrão do Node, não infraestrutura de terceiro; o `application` já depende de
 * builtins `node:*` na camada de conversão, então não fere a regra de "application
 * não importa infrastructure".
 */
export class RecordConversionUseCase {
  constructor(
    private readonly repository: ConversionJobRepositoryPort,
    private readonly logger?: LoggerPort,
  ) {}

  /**
   * Nunca propaga erro: uma falha ao gravar o histórico não pode derrubar uma
   * conversão que já foi entregue ao usuário. Falhas de persistência só viram log.
   */
  async execute(input: RecordConversionInput): Promise<void> {
    const fileNameHash = createHash("sha256").update(input.fileName).digest("hex").slice(0, 12);

    const base = {
      userId: input.userId,
      displayName: input.fileName,
      fileNameHash,
      from: input.from,
      to: input.to,
      category: input.category,
      engine: input.engine,
      sizeBytes: input.sizeBytes,
      durationMs: input.durationMs,
    };

    const job =
      input.status === "completed"
        ? ConversionJob.completed({ ...base, outputSizeBytes: input.outputSizeBytes })
        : ConversionJob.failed({ ...base, errorCode: input.errorCode });

    try {
      await this.repository.save(job);
      this.logger?.info({
        event: "conversion_recorded",
        service: "history-service",
        userId: input.userId,
      });
    } catch (error) {
      this.logger?.error({
        event: "conversion_record_failed",
        service: "history-service",
        userId: input.userId,
        error,
      });
    }
  }
}
