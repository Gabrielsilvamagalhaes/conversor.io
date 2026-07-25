import { describe, expect, it, vi } from "vitest";
import type { ConversionJob } from "@/domain/conversion/entities/conversion-job";
import type { ConversionJobRepositoryPort } from "@/domain/conversion/ports/conversion-job-repository.port";
import type { LogEvent, LoggerPort } from "@/domain/observability/ports/logger.port";
import { RecordConversionUseCase } from "./record-conversion.use-case";

function makeRepository(save: (job: ConversionJob) => Promise<void>): ConversionJobRepositoryPort {
  return {
    save: vi.fn(save),
    listByUser: vi.fn(),
    statsByUser: vi.fn(),
    countByUserSince: vi.fn(),
  };
}

function makeLogger(): LoggerPort {
  const logger: LoggerPort = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => logger),
  };
  return logger;
}

const baseInput = {
  userId: "user-1",
  fileName: "relatorio.csv",
  from: "csv" as const,
  to: "xlsx" as const,
  category: "spreadsheets" as const,
  engine: "server" as const,
  sizeBytes: 1024,
  durationMs: 200,
};

describe("RecordConversionUseCase", () => {
  it("grava um job concluído e loga sucesso", async () => {
    const repository = makeRepository(async () => {});
    const logger = makeLogger();
    const useCase = new RecordConversionUseCase(repository, logger);

    await useCase.execute({ ...baseInput, status: "completed", outputSizeBytes: 2048 });

    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedJob = (repository.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as ConversionJob;
    expect(savedJob.status).toBe("completed");
    expect(savedJob.outputSizeBytes).toBe(2048);
    expect(savedJob.userId).toBe("user-1");
    // Nunca grava o nome do arquivo em claro fora de displayName controlado pelo próprio job.
    expect(savedJob.fileNameHash).toMatch(/^[a-f0-9]{12}$/);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "conversion_recorded", service: "history-service" }),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("grava um job com falha", async () => {
    const repository = makeRepository(async () => {});
    const useCase = new RecordConversionUseCase(repository);

    await useCase.execute({ ...baseInput, status: "failed", errorCode: "UNSUPPORTED_FORMAT" });

    const savedJob = (repository.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as ConversionJob;
    expect(savedJob.status).toBe("failed");
    expect(savedJob.errorCode).toBe("UNSUPPORTED_FORMAT");
  });

  it("NUNCA propaga erro quando o repositório falha — apenas loga", async () => {
    const boom = new Error("Firestore indisponível");
    const repository = makeRepository(async () => {
      throw boom;
    });
    const logger = makeLogger();
    const useCase = new RecordConversionUseCase(repository, logger);

    await expect(
      useCase.execute({ ...baseInput, status: "completed", outputSizeBytes: 2048 }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "conversion_record_failed",
        service: "history-service",
        userId: "user-1",
        error: boom,
      } satisfies Partial<LogEvent>),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("resolve sem lançar mesmo sem logger injetado", async () => {
    const repository = makeRepository(async () => {
      throw new Error("Firestore indisponível");
    });
    const useCase = new RecordConversionUseCase(repository);

    await expect(
      useCase.execute({ ...baseInput, status: "completed", outputSizeBytes: 2048 }),
    ).resolves.toBeUndefined();
  });
});
