import { describe, expect, it } from "vitest";
import { type CompletedConversionJobInput, ConversionJob } from "./conversion-job";

const baseInput = {
  userId: "user-1",
  displayName: "relatorio.csv",
  fileNameHash: "abcdef123456",
  from: "csv" as const,
  to: "xlsx" as const,
  category: "spreadsheets" as const,
  engine: "server" as const,
  sizeBytes: 1024,
  durationMs: 250,
};

describe("ConversionJob", () => {
  describe("completed", () => {
    it("cria um job concluído com defaults de id/createdAt", () => {
      const job = ConversionJob.completed({ ...baseInput, outputSizeBytes: 2048 });

      expect(job.status).toBe("completed");
      expect(job.outputSizeBytes).toBe(2048);
      expect(job.errorCode).toBeNull();
      expect(job.storageKey).toBeNull();
      expect(job.expiresAt).toBeNull();
      expect(job.id).toEqual(expect.any(String));
      expect(job.id.length).toBeGreaterThan(0);
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it("é determinístico quando id/createdAt são injetados", () => {
      const createdAt = new Date("2026-07-01T12:00:00.000Z");
      const job = ConversionJob.completed({
        ...baseInput,
        outputSizeBytes: 2048,
        id: "job-fixo",
        createdAt,
      });

      expect(job.id).toBe("job-fixo");
      expect(job.createdAt).toBe(createdAt);
    });

    it("rejeita userId vazio", () => {
      expect(() =>
        ConversionJob.completed({ ...baseInput, userId: "   ", outputSizeBytes: 10 }),
      ).toThrow("userId não pode ser vazio");
    });

    it("rejeita sizeBytes negativo", () => {
      expect(() =>
        ConversionJob.completed({ ...baseInput, sizeBytes: -1, outputSizeBytes: 10 }),
      ).toThrow("sizeBytes não pode ser negativo");
    });

    it("rejeita durationMs negativo", () => {
      expect(() =>
        ConversionJob.completed({ ...baseInput, durationMs: -1, outputSizeBytes: 10 }),
      ).toThrow("durationMs não pode ser negativo");
    });

    it("rejeita outputSizeBytes ausente (invariante defensiva contra reconstrução corrompida)", () => {
      const invalidInput = {
        ...baseInput,
        outputSizeBytes: null,
      } as unknown as CompletedConversionJobInput;

      expect(() => ConversionJob.completed(invalidInput)).toThrow("exige outputSizeBytes");
    });
  });

  describe("failed", () => {
    it("cria um job com falha", () => {
      const job = ConversionJob.failed({ ...baseInput, errorCode: "UNSUPPORTED_FORMAT" });

      expect(job.status).toBe("failed");
      expect(job.errorCode).toBe("UNSUPPORTED_FORMAT");
      expect(job.outputSizeBytes).toBeNull();
    });

    it("rejeita errorCode vazio", () => {
      expect(() => ConversionJob.failed({ ...baseInput, errorCode: "" })).toThrow(
        "exige errorCode",
      );
    });

    it("rejeita errorCode em branco", () => {
      expect(() => ConversionJob.failed({ ...baseInput, errorCode: "   " })).toThrow(
        "exige errorCode",
      );
    });
  });

  describe("toSnapshot", () => {
    it("devolve um retrato plano equivalente aos campos da entidade", () => {
      const createdAt = new Date("2026-07-01T12:00:00.000Z");
      const job = ConversionJob.completed({
        ...baseInput,
        outputSizeBytes: 2048,
        id: "job-1",
        createdAt,
      });

      expect(job.toSnapshot()).toEqual({
        id: "job-1",
        userId: "user-1",
        displayName: "relatorio.csv",
        fileNameHash: "abcdef123456",
        from: "csv",
        to: "xlsx",
        category: "spreadsheets",
        engine: "server",
        sizeBytes: 1024,
        outputSizeBytes: 2048,
        status: "completed",
        durationMs: 250,
        errorCode: null,
        createdAt,
        storageKey: null,
        expiresAt: null,
      });
    });
  });
});
