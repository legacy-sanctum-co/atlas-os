import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { user } from "@/core/auth/schema";
import { createdAt, id } from "@/core/db/columns";

import type { AtlasEventType } from "../domain/event";

/**
 * Append-only audit and event spine. Every meaningful action is recorded.
 * Never updated or deleted by application code. `user_id` is nullable only
 * for system events that precede an owner (e.g. bootstrap).
 */
export const atlasEvent = pgTable(
  "atlas_event",
  {
    id: id(),
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    type: text().$type<AtlasEventType>().notNull(),
    subjectType: text(),
    subjectId: uuid(),
    /** Redacted payload — never prompts, message content, or secrets. */
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    /** Free-form actor label, e.g. `owner`, `atlas`, `system`. */
    actor: text().notNull().default("owner"),
    requestId: text(),
    createdAt: createdAt(),
  },
  (table) => [
    index("atlas_event_user_created_idx").on(table.userId, table.createdAt),
    index("atlas_event_subject_idx").on(table.subjectType, table.subjectId),
  ],
);

export type AtlasEventRow = typeof atlasEvent.$inferSelect;
