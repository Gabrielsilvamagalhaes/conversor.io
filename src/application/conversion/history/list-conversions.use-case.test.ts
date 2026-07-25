import { describe, expect, it, vi } from "vitest";
import { ConversionJob } from "@/domain/conversion/entities/conversion-job";
import type {
  ConversionJobPage,
  ConversionJobRepositoryPort,
} from "@/domain/conversion/ports/conversion-job-repository.port";
import { ListConversionsUseCase } from "./list-conversions.use-case";

function makeRepository(page: ConversionJobPage): ConversionJobRepositoryPort {
  return {
    save: vi.fn(),
    listByUser: vi.fn(async () => page),
    statsByUser: vi.fn(),
    countByUserSince: vi.fn(),
  };
}

function makeJob(overrides: { id: string; createdAt: Date }): ConversionJob {
  return ConversionJob.completed({
    id: overrides.id,
    createdAt: overrides.createdAt,
    userId: "user-1",
    displayName: "relatorio.csv",
    fileNameHash: "abcdef123456",
    from: "csv",
    to: "xlsx",
    category: "spreadsheets",
    engine: "server",
    sizeBytes: 1024,
    outputSizeBytes: 2048,
    durationMs: 100,
  });
}

describe("ListConversionsUseCase", () => {
  it("mapeia a página para DTO com nextCursor quando há mais páginas", async () => {
    const jobs = [
      makeJob({ id: "job-2", createdAt: new Date("2026-07-02T00:00:00.000Z") }),
      makeJob({ id: "job-1", createdAt: new Date("2026-07-01T00:00:00.000Z") }),
    ];
    const repository = makeRepository({ jobs, nextCursor: "job-1" });
    const useCase = new ListConversionsUseCase(repository);

    const result = await useCase.execute({ userId: "user-1", limit: 2 });

    expect(repository.listByUser).toHaveBeenCalledWith("user-1", { limit: 2, cursor: undefined });
    expect(result.nextCursor).toBe("job-1");
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ id: "job-2", from: "csv", to: "xlsx" });
    expect(result.items[0].createdAt).toBe("2026-07-02T00:00:00.000Z");
  });

  it("nextCursor é null quando não há mais páginas", async () => {
    const jobs = [makeJob({ id: "job-1", createdAt: new Date("2026-07-01T00:00:00.000Z") })];
    const repository = makeRepository({ jobs, nextCursor: null });
    const useCase = new ListConversionsUseCase(repository);

    const result = await useCase.execute({
      userId: "user-1",
      limit: 20,
      cursor: "cursor-anterior",
    });

    expect(repository.listByUser).toHaveBeenCalledWith("user-1", {
      limit: 20,
      cursor: "cursor-anterior",
    });
    expect(result.nextCursor).toBeNull();
  });

  it("o DTO é 100% serializável — nenhum Date nem instância de ConversionJob", async () => {
    const jobs = [makeJob({ id: "job-1", createdAt: new Date("2026-07-01T00:00:00.000Z") })];
    const repository = makeRepository({ jobs, nextCursor: null });
    const useCase = new ListConversionsUseCase(repository);

    const result = await useCase.execute({ userId: "user-1", limit: 10 });

    for (const item of result.items) {
      expect(item).not.toBeInstanceOf(ConversionJob);
      for (const value of Object.values(item)) {
        expect(value).not.toBeInstanceOf(Date);
        expect(value).not.toBeInstanceOf(ConversionJob);
      }
    }

    // JSON round-trip não deve perder nem transformar nada de forma inesperada.
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
