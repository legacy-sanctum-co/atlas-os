import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "@/core/db/schema";

/**
 * Real-database checks against the migrated schema. Requires
 * TEST_DATABASE_URL (or DATABASE_URL) pointing at a Postgres with pgvector.
 * Skipped when neither is set so unit runs stay hermetic.
 */
const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!url)("foundation schema", () => {
  const sqlClient = postgres(url ?? "", { max: 1, prepare: false, onnotice: () => undefined });
  const db = drizzle(sqlClient, { schema, casing: "snake_case" });
  const ownerId = randomUUID();
  const strangerId = randomUUID();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./drizzle" });
    await db.insert(schema.user).values([
      { id: ownerId, name: "Owner", email: `owner-${ownerId}@test.local` },
      { id: strangerId, name: "Stranger", email: `stranger-${strangerId}@test.local` },
    ]);
  });

  afterAll(async () => {
    await db.delete(schema.user).where(eq(schema.user.id, ownerId));
    await db.delete(schema.user).where(eq(schema.user.id, strangerId));
    await db.delete(schema.embeddingModel).where(eq(schema.embeddingModel.id, "test:model:1536"));
    await sqlClient.end();
  });

  it("has pgvector enabled and the migrations journal applied", async () => {
    const [ext] = await db.execute<{ extname: string }>(
      sql`select extname from pg_extension where extname = 'vector'`,
    );
    expect(ext?.extname).toBe("vector");
  });

  it("creates a profile per user and cascades on user delete", async () => {
    const tempId = randomUUID();
    await db.insert(schema.user).values({ id: tempId, name: "Temp", email: `${tempId}@t.local` });
    await db.insert(schema.userProfile).values({ userId: tempId, displayName: "Temp" });
    await db.delete(schema.user).where(eq(schema.user.id, tempId));
    const rows = await db
      .select()
      .from(schema.userProfile)
      .where(eq(schema.userProfile.userId, tempId));
    expect(rows).toHaveLength(0);
  });

  it("scopes venture/project slugs per owner", async () => {
    const [v1] = await db
      .insert(schema.venture)
      .values({ userId: ownerId, name: "Sanctum", slug: "sanctum" })
      .returning();
    const [v2] = await db
      .insert(schema.venture)
      .values({ userId: strangerId, name: "Sanctum", slug: "sanctum" })
      .returning();
    expect(v1?.id).toBeDefined();
    expect(v2?.id).toBeDefined();
    await expect(
      db.insert(schema.venture).values({ userId: ownerId, name: "Dup", slug: "sanctum" }),
    ).rejects.toThrow();

    const [p] = await db
      .insert(schema.project)
      .values({ userId: ownerId, ventureId: v1?.id, name: "Site", slug: "site" })
      .returning();
    expect(p?.ventureId).toBe(v1?.id);

    // Deleting a venture leaves the project but nulls the reference.
    await db.delete(schema.venture).where(eq(schema.venture.id, v1?.id ?? ""));
    const [after] = await db
      .select()
      .from(schema.project)
      .where(eq(schema.project.id, p?.id ?? ""));
    expect(after?.ventureId).toBeNull();
  });

  it("stores memories with a generated tsvector and derived embeddings", async () => {
    await db
      .insert(schema.embeddingModel)
      .values({ id: "test:model:1536", provider: "test", model: "model", dimensions: 1536 })
      .onConflictDoNothing();

    const [mem] = await db
      .insert(schema.memory)
      .values({ userId: ownerId, kind: "fact", content: "Owner prefers direct feedback" })
      .returning();
    expect(mem?.status).toBe("candidate");

    const [found] = await db
      .select({ id: schema.memory.id })
      .from(schema.memory)
      .where(sql`${schema.memory.search} @@ plainto_tsquery('english', 'direct feedback')`);
    expect(found?.id).toBe(mem?.id);

    const vector = Array.from({ length: 1536 }, (_, i) => (i === 0 ? 1 : 0));
    await db.insert(schema.memoryEmbedding1536).values({
      memoryId: mem?.id ?? "",
      embeddingModelId: "test:model:1536",
      embedding: vector,
      contentHash: "hash",
    });

    const [nearest] = await db.execute<{ memory_id: string; distance: number }>(
      sql`select memory_id, embedding <=> ${`[${vector.join(",")}]`}::vector as distance
          from memory_embedding_1536 order by distance limit 1`,
    );
    expect(nearest?.memory_id).toBe(mem?.id);
    expect(Number(nearest?.distance)).toBeCloseTo(0, 5);

    // Deleting the memory removes its embeddings; the model registry stays.
    await db.delete(schema.memory).where(eq(schema.memory.id, mem?.id ?? ""));
    const embeddings = await db.select().from(schema.memoryEmbedding1536);
    expect(embeddings.find((e) => e.memoryId === mem?.id)).toBeUndefined();
  });

  it("rejects an embedding dimension mismatch at the database boundary", async () => {
    const [mem] = await db
      .insert(schema.memory)
      .values({ userId: ownerId, kind: "fact", content: "dimension check" })
      .returning();
    const failure = await db
      .insert(schema.memoryEmbedding1536)
      .values({
        memoryId: mem?.id ?? "",
        embeddingModelId: "test:model:1536",
        embedding: [1, 2, 3],
        contentHash: "x",
      })
      .then(() => null)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    const cause = (failure as Error & { cause?: { message?: string } }).cause;
    expect(cause?.message ?? (failure as Error).message).toMatch(/dimension/i);
  });

  it("appends atlas events with and without an owner", async () => {
    await db.insert(schema.atlasEvent).values([
      { type: "system.bootstrap.completed", actor: "system" },
      { userId: ownerId, type: "profile.created", actor: "system" },
    ]);
    const rows = await db
      .select()
      .from(schema.atlasEvent)
      .where(eq(schema.atlasEvent.userId, ownerId));
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
