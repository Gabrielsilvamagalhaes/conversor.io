import type { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { ConversionJob } from "@/domain/conversion/entities/conversion-job";
import { toDocument } from "./conversion-job.mapper";
import { FirestoreConversionJobRepository } from "./firestore-conversion-job.repository";

/**
 * Fake mínimo do client Firestore: implementa só a fatia de `collection/doc/where/
 * orderBy/limit/startAfter/get/count` usada pelo repositório, com filtragem/ordenação
 * reais em memória. Mais robusto que mockar chamada-a-chamada porque exercita o
 * comportamento de fato (clamp, cursor, janela de datas), sem precisar do emulador.
 */
type FakeDocData = Record<string, unknown>;

class FakeQuery {
  constructor(protected docs: Array<{ id: string; data: FakeDocData }>) {}

  where(field: string, op: string, value: unknown): FakeQuery {
    if (op !== ">=") throw new Error(`operador não suportado no fake: ${op}`);
    const threshold = (value as Timestamp).toDate().getTime();
    return new FakeQuery(
      this.docs.filter((doc) => (doc.data[field] as Timestamp).toDate().getTime() >= threshold),
    );
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): FakeQuery {
    const sorted = [...this.docs].sort((a, b) => {
      const av = (a.data[field] as Timestamp).toDate().getTime();
      const bv = (b.data[field] as Timestamp).toDate().getTime();
      return direction === "desc" ? bv - av : av - bv;
    });
    return new FakeQuery(sorted);
  }

  limit(n: number): FakeQuery {
    return new FakeQuery(this.docs.slice(0, n));
  }

  startAfter(snapshot: { id: string }): FakeQuery {
    const index = this.docs.findIndex((doc) => doc.id === snapshot.id);
    return new FakeQuery(index === -1 ? [] : this.docs.slice(index + 1));
  }

  count() {
    return { get: async () => ({ data: () => ({ count: this.docs.length }) }) };
  }

  async get() {
    return { docs: this.docs.map((doc) => ({ id: doc.id, data: () => doc.data })) };
  }
}

class FakeCollection extends FakeQuery {
  private readonly store = new Map<string, FakeDocData>();

  constructor() {
    super([]);
  }

  private syncDocs(): void {
    this.docs = Array.from(this.store.entries()).map(([id, data]) => ({ id, data }));
  }

  doc(id: string) {
    return {
      id,
      get: async () => {
        const data = this.store.get(id);
        return { exists: data !== undefined, id, data: () => data };
      },
      set: async (data: FakeDocData) => {
        this.store.set(id, data);
      },
    };
  }

  // Reimplementa os métodos de leitura para sempre refletir o estado atual do `store`
  // (a classe base opera sobre `docs`, que é um snapshot imutável).
  override where(field: string, op: string, value: unknown): FakeQuery {
    this.syncDocs();
    return new FakeQuery(this.docs).where(field, op, value);
  }

  override orderBy(field: string, direction: "asc" | "desc" = "asc"): FakeQuery {
    this.syncDocs();
    return new FakeQuery(this.docs).orderBy(field, direction);
  }

  override limit(n: number): FakeQuery {
    this.syncDocs();
    return new FakeQuery(this.docs).limit(n);
  }

  override count() {
    this.syncDocs();
    return new FakeQuery(this.docs).count();
  }

  override async get() {
    this.syncDocs();
    return new FakeQuery(this.docs).get();
  }
}

class FakeFirestore {
  private readonly usersConversions = new Map<string, FakeCollection>();

  private conversionsFor(userId: string): FakeCollection {
    let collection = this.usersConversions.get(userId);
    if (!collection) {
      collection = new FakeCollection();
      this.usersConversions.set(userId, collection);
    }
    return collection;
  }

  collection(name: string) {
    if (name !== "users")
      throw new Error(`fake só suporta a coleção raiz 'users', recebeu '${name}'`);
    return {
      doc: (userId: string) => ({
        collection: (sub: string) => {
          if (sub !== "conversions") {
            throw new Error(`fake só suporta a subcoleção 'conversions', recebeu '${sub}'`);
          }
          return this.conversionsFor(userId);
        },
      }),
    };
  }
}

function makeRepository(): { repository: FirestoreConversionJobRepository; db: FakeFirestore } {
  const db = new FakeFirestore();
  // biome-ignore lint/suspicious/noExplicitAny: fake mínimo não implementa toda a superfície de Firestore
  const repository = new FirestoreConversionJobRepository(() => db as any);
  return { repository, db };
}

function makeJob(
  id: string,
  createdAt: Date,
  overrides: Partial<{ sizeBytes: number; from: "csv" | "mp4"; to: "xlsx" | "mp3" }> = {},
) {
  return ConversionJob.completed({
    id,
    createdAt,
    userId: "user-1",
    displayName: `arquivo-${id}.csv`,
    fileNameHash: "abcdef123456",
    from: overrides.from ?? "csv",
    to: overrides.to ?? "xlsx",
    category: "spreadsheets",
    engine: "server",
    sizeBytes: overrides.sizeBytes ?? 100,
    outputSizeBytes: 200,
    durationMs: 10,
  });
}

describe("FirestoreConversionJobRepository", () => {
  it("save grava o documento mapeado sob users/{uid}/conversions/{jobId}", async () => {
    const { repository, db } = makeRepository();
    const job = makeJob("job-1", new Date("2026-07-01T00:00:00.000Z"));

    await repository.save(job);

    const stored = await db
      .collection("users")
      .doc("user-1")
      .collection("conversions")
      .doc("job-1")
      .get();
    expect(stored.exists).toBe(true);
    expect(stored.data()).toEqual(toDocument(job));
  });

  describe("listByUser", () => {
    it("clampa o limit para o intervalo [1, 100]", async () => {
      const { repository } = makeRepository();
      for (let i = 0; i < 3; i++) {
        await repository.save(makeJob(`job-${i}`, new Date(2026, 6, i + 1)));
      }

      const zero = await repository.listByUser("user-1", { limit: 0 });
      expect(zero.jobs).toHaveLength(1);

      const tooMany = await repository.listByUser("user-1", { limit: 1000 });
      expect(tooMany.jobs).toHaveLength(3);
    });

    it("calcula nextCursor corretamente e pagina com cursor", async () => {
      const { repository } = makeRepository();
      await repository.save(makeJob("job-1", new Date("2026-07-01T00:00:00.000Z")));
      await repository.save(makeJob("job-2", new Date("2026-07-02T00:00:00.000Z")));
      await repository.save(makeJob("job-3", new Date("2026-07-03T00:00:00.000Z")));

      const firstPage = await repository.listByUser("user-1", { limit: 2 });
      expect(firstPage.jobs.map((j) => j.id)).toEqual(["job-3", "job-2"]);
      expect(firstPage.nextCursor).toBe("job-2");

      const secondPage = await repository.listByUser("user-1", {
        limit: 2,
        cursor: firstPage.nextCursor ?? undefined,
      });
      expect(secondPage.jobs.map((j) => j.id)).toEqual(["job-1"]);
      expect(secondPage.nextCursor).toBeNull();
    });
  });

  describe("statsByUser", () => {
    it("byDay sempre devolve 14 entradas, com zeros nos dias sem conversão", async () => {
      const { repository } = makeRepository();
      await repository.save(makeJob("job-today", new Date()));

      const stats = await repository.statsByUser("user-1");

      expect(stats.byDay).toHaveLength(14);
      const totalCount = stats.byDay.reduce((sum, day) => sum + day.count, 0);
      expect(totalCount).toBe(1);
      // ordem cronológica crescente
      const dates = stats.byDay.map((d) => d.date);
      expect(dates).toEqual([...dates].sort());
      // último dia da janela é hoje, com a conversão registrada
      expect(stats.byDay[stats.byDay.length - 1].count).toBe(1);
    });

    it("agrega total, totalBytes e topPair", async () => {
      const { repository } = makeRepository();
      await repository.save(
        makeJob("job-1", new Date(), { sizeBytes: 100, from: "csv", to: "xlsx" }),
      );
      await repository.save(
        makeJob("job-2", new Date(), { sizeBytes: 200, from: "csv", to: "xlsx" }),
      );
      await repository.save(
        makeJob("job-3", new Date(), { sizeBytes: 300, from: "mp4", to: "mp3" }),
      );

      const stats = await repository.statsByUser("user-1");

      expect(stats.total).toBe(3);
      expect(stats.last30Days).toBe(3);
      expect(stats.totalBytes).toBe(600);
      expect(stats.topPair).toEqual({ from: "csv", to: "xlsx", count: 2 });
    });
  });

  describe("countByUserSince", () => {
    it("conta apenas documentos a partir da data informada", async () => {
      const { repository } = makeRepository();
      await repository.save(makeJob("job-old", new Date("2020-01-01T00:00:00.000Z")));
      await repository.save(makeJob("job-new", new Date()));

      const count = await repository.countByUserSince(
        "user-1",
        new Date("2025-01-01T00:00:00.000Z"),
      );
      expect(count).toBe(1);
    });
  });
});
