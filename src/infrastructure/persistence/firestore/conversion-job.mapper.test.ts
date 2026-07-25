import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { ConversionJob } from "@/domain/conversion/entities/conversion-job";
import { fromDocument, toDocument } from "./conversion-job.mapper";

// `Timestamp` do firebase-admin é um value object puro (sem dependência de rede/app
// inicializado), então usamos a classe real em vez de um fake — mais fiel ao round-trip real.

describe("conversion-job.mapper", () => {
  it("round-trip toDocument/fromDocument para um job concluído", () => {
    const createdAt = new Date("2026-07-01T12:00:00.000Z");
    const job = ConversionJob.completed({
      id: "job-1",
      createdAt,
      userId: "user-1",
      displayName: "relatorio.csv",
      fileNameHash: "abcdef123456",
      from: "csv",
      to: "xlsx",
      category: "spreadsheets",
      engine: "server",
      sizeBytes: 1024,
      outputSizeBytes: 2048,
      durationMs: 250,
    });

    const doc = toDocument(job);
    expect(doc.createdAt).toBeInstanceOf(Timestamp);

    const roundTripped = fromDocument(job.id, doc as unknown as Record<string, unknown>);
    expect(roundTripped.toSnapshot()).toEqual(job.toSnapshot());
  });

  it("round-trip toDocument/fromDocument para um job com falha", () => {
    const createdAt = new Date("2026-07-01T12:00:00.000Z");
    const job = ConversionJob.failed({
      id: "job-2",
      createdAt,
      userId: "user-1",
      displayName: "video.mp4",
      fileNameHash: "112233445566",
      from: "mp4",
      to: "mp3",
      category: "media",
      engine: "client",
      sizeBytes: 4096,
      errorCode: "UNSUPPORTED_FORMAT",
      durationMs: 50,
    });

    const doc = toDocument(job);
    const roundTripped = fromDocument(job.id, doc as unknown as Record<string, unknown>);
    expect(roundTripped.toSnapshot()).toEqual(job.toSnapshot());
  });

  it("lança erro pt-BR claro quando um campo obrigatório está ausente", () => {
    const job = ConversionJob.completed({
      id: "job-3",
      userId: "user-1",
      displayName: "a.csv",
      fileNameHash: "abcdef123456",
      from: "csv",
      to: "xlsx",
      category: "spreadsheets",
      engine: "server",
      sizeBytes: 10,
      outputSizeBytes: 20,
      durationMs: 5,
    });
    const doc = toDocument(job) as unknown as Record<string, unknown>;
    const { userId: _omit, ...corrupted } = doc;

    expect(() => fromDocument(job.id, corrupted)).toThrow(/campo "userId"/);
  });

  it("lança erro pt-BR claro quando status é inválido", () => {
    const job = ConversionJob.completed({
      id: "job-4",
      userId: "user-1",
      displayName: "a.csv",
      fileNameHash: "abcdef123456",
      from: "csv",
      to: "xlsx",
      category: "spreadsheets",
      engine: "server",
      sizeBytes: 10,
      outputSizeBytes: 20,
      durationMs: 5,
    });
    const doc = toDocument(job) as unknown as Record<string, unknown>;
    const corrupted = { ...doc, status: "processing" };

    expect(() => fromDocument(job.id, corrupted)).toThrow(/campo "status"/);
  });

  it("lança erro pt-BR claro quando createdAt não é um Timestamp válido", () => {
    const job = ConversionJob.completed({
      id: "job-5",
      userId: "user-1",
      displayName: "a.csv",
      fileNameHash: "abcdef123456",
      from: "csv",
      to: "xlsx",
      category: "spreadsheets",
      engine: "server",
      sizeBytes: 10,
      outputSizeBytes: 20,
      durationMs: 5,
    });
    const doc = toDocument(job) as unknown as Record<string, unknown>;
    const corrupted = { ...doc, createdAt: "2026-07-01" };

    expect(() => fromDocument(job.id, corrupted)).toThrow(/campo "createdAt"/);
  });

  it("lança erro pt-BR claro quando completed não tem outputSizeBytes", () => {
    const job = ConversionJob.completed({
      id: "job-6",
      userId: "user-1",
      displayName: "a.csv",
      fileNameHash: "abcdef123456",
      from: "csv",
      to: "xlsx",
      category: "spreadsheets",
      engine: "server",
      sizeBytes: 10,
      outputSizeBytes: 20,
      durationMs: 5,
    });
    const doc = toDocument(job) as unknown as Record<string, unknown>;
    const corrupted = { ...doc, outputSizeBytes: null };

    expect(() => fromDocument(job.id, corrupted)).toThrow(/outputSizeBytes/);
  });
});
