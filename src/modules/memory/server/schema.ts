import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "@/core/auth/schema";
import { archivedAt, createdAt, id, updatedAt } from "@/core/db/columns";
import { message } from "@/modules/conversation/server/schema";
import { project, venture } from "@/modules/ventures/server/schema";

import type { MemoryKind, MemoryStatus } from "../domain/memory";

export const memoryKindEnum = pgEnum("memory_kind", [
  "fact",
  "preference",
  "goal",
  "decision",
  "insight",
  "relationship",
  "event",
]);

export const memoryStatusEnum = pgEnum("memory_status", [
  "candidate",
  "active",
  "superseded",
  "rejected",
]);

export const embeddingModelStatusEnum = pgEnum("embedding_model_status", [
  "active",
  "retiring",
  "retired",
]);

/** Postgres tsvector; generated from `content`. */
const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

/** pgvector `vector(N)`; dimension is fixed per physical table (ADR 0009). */
const vector = (dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dimensions})`,
    toDriver: (value) => `[${value.join(",")}]`,
    fromDriver: (value) =>
      value
        .slice(1, -1)
        .split(",")
        .map((component) => Number.parseFloat(component)),
  });

/**
 * Canonical memory record. ADD-only with supersession; no embedding here —
 * embeddings are derived representations in `memory_embedding_*`.
 */
export const memory = pgTable(
  "memory",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: memoryKindEnum().$type<MemoryKind>().notNull(),
    status: memoryStatusEnum().$type<MemoryStatus>().notNull().default("candidate"),
    content: text().notNull(),
    search: tsvector()
      .notNull()
      .generatedAlwaysAs(sql`to_tsvector('english', "content")`),
    importance: real().notNull().default(0.5),
    confidence: real().notNull().default(0.7),
    sourceMessageId: uuid().references(() => message.id, { onDelete: "set null" }),
    ventureId: uuid().references(() => venture.id, { onDelete: "set null" }),
    projectId: uuid().references(() => project.id, { onDelete: "set null" }),
    entities: jsonb().$type<string[]>().notNull().default([]),
    supersedesId: uuid(),
    lastAccessedAt: timestamp({ withTimezone: true, mode: "date" }),
    accessCount: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: archivedAt(),
  },
  (table) => [
    index("memory_user_status_idx").on(table.userId, table.status),
    index("memory_search_gin_idx").using("gin", table.search),
    index("memory_project_idx").on(table.projectId),
  ],
);

/** Registry of every embedding space the system has used (ADR 0009). */
export const embeddingModel = pgTable("embedding_model", {
  /** Stable slug, e.g. `openai:text-embedding-3-small:1536`. */
  id: text().primaryKey(),
  provider: text().notNull(),
  model: text().notNull(),
  modelVersion: text(),
  dimensions: integer().notNull(),
  status: embeddingModelStatusEnum().notNull().default("active"),
  createdAt: createdAt(),
  retiredAt: timestamp({ withTimezone: true, mode: "date" }),
});

/**
 * Physical embedding table for 1536-dimensional spaces. A migration adds
 * `memory_embedding_<N>` when a model with a different N is activated; the
 * repository selects the table by the active model's dimensions.
 */
export const memoryEmbedding1536 = pgTable(
  "memory_embedding_1536",
  {
    memoryId: uuid()
      .notNull()
      .references(() => memory.id, { onDelete: "cascade" }),
    embeddingModelId: text()
      .notNull()
      .references(() => embeddingModel.id, { onDelete: "restrict" }),
    embedding: vector(1536)().notNull(),
    /** SHA-256 of the embedded text; skips re-embedding unchanged content. */
    contentHash: text().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.memoryId, table.embeddingModelId] }),
    index("memory_embedding_1536_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({ m: 16, ef_construction: 64 }),
  ],
);

export type MemoryRow = typeof memory.$inferSelect;
export type EmbeddingModelRow = typeof embeddingModel.$inferSelect;
