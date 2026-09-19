import { index, integer, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { user } from "@/core/auth/schema";
import { createdAt, id } from "@/core/db/columns";
import { message } from "@/modules/conversation/server/schema";

import type { ToolInvocationStatus } from "../domain/capability";

export const toolInvocationStatusEnum = pgEnum("tool_invocation_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
  "denied",
]);

/**
 * Every capability execution (tools now, Operatives later) is recorded here.
 * Inputs/outputs are stored as given; sensitive ones will be encrypted via
 * core/crypto when such capabilities exist (none do in Phase 1).
 */
export const toolInvocation = pgTable(
  "tool_invocation",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    messageId: uuid().references(() => message.id, { onDelete: "set null" }),
    capabilityId: text().notNull(),
    input: jsonb().$type<unknown>().notNull(),
    output: jsonb().$type<unknown>(),
    status: toolInvocationStatusEnum().$type<ToolInvocationStatus>().notNull().default("pending"),
    error: text(),
    durationMs: integer(),
    createdAt: createdAt(),
  },
  (table) => [
    index("tool_invocation_user_created_idx").on(table.userId, table.createdAt),
    index("tool_invocation_message_idx").on(table.messageId),
  ],
);

export type ToolInvocationRow = typeof toolInvocation.$inferSelect;
