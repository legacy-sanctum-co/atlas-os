import { index, jsonb, pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { user } from "@/core/auth/schema";
import { archivedAt, createdAt, id, updatedAt } from "@/core/db/columns";

import type { ProjectStatus, VentureStage, VentureStatus } from "../domain/venture";

export const ventureStageEnum = pgEnum("venture_stage", [
  "idea",
  "building",
  "operating",
  "scaling",
  "paused",
  "exited",
]);

export const ventureStatusEnum = pgEnum("venture_status", ["active", "archived"]);

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "blocked",
  "done",
  "archived",
]);

/** A business, brand, or major initiative (docs/DATA-MODEL.md). */
export const venture = pgTable(
  "venture",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text().notNull(),
    slug: text().notNull(),
    oneLiner: text(),
    stage: ventureStageEnum().$type<VentureStage>().notNull().default("building"),
    status: ventureStatusEnum().$type<VentureStatus>().notNull().default("active"),
    context: text(),
    goals: jsonb().$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: archivedAt(),
  },
  (table) => [
    uniqueIndex("venture_user_slug_uidx").on(table.userId, table.slug),
    index("venture_user_status_idx").on(table.userId, table.status),
  ],
);

/** Concrete effort; optionally belongs to a venture. */
export const project = pgTable(
  "project",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ventureId: uuid().references(() => venture.id, { onDelete: "set null" }),
    name: text().notNull(),
    slug: text().notNull(),
    status: projectStatusEnum().$type<ProjectStatus>().notNull().default("active"),
    objective: text(),
    context: text(),
    nextStep: text(),
    blockers: jsonb().$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: archivedAt(),
  },
  (table) => [
    uniqueIndex("project_user_slug_uidx").on(table.userId, table.slug),
    index("project_user_status_idx").on(table.userId, table.status),
    index("project_venture_idx").on(table.ventureId),
  ],
);

export type VentureRow = typeof venture.$inferSelect;
export type ProjectRow = typeof project.$inferSelect;
