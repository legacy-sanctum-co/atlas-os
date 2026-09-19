import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "@/core/auth/schema";
import { archivedAt, createdAt, id, updatedAt } from "@/core/db/columns";
import { project, venture } from "@/modules/ventures/server/schema";

import type { MessagePart, MessageRole } from "../domain/message";

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);

export const conversation = pgTable(
  "conversation",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text(),
    summary: text(),
    ventureId: uuid().references(() => venture.id, { onDelete: "set null" }),
    projectId: uuid().references(() => project.id, { onDelete: "set null" }),
    lastMessageAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: archivedAt(),
  },
  (table) => [
    index("conversation_user_recent_idx").on(table.userId, table.lastMessageAt),
    index("conversation_project_idx").on(table.projectId),
  ],
);

/**
 * Stores the AI SDK UIMessage shape (role + parts). `user_id` is duplicated
 * from the conversation so ownership checks never need a join.
 */
export const message = pgTable(
  "message",
  {
    id: id(),
    conversationId: uuid()
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: messageRoleEnum().$type<MessageRole>().notNull(),
    parts: jsonb().$type<MessagePart[]>().notNull(),
    /** Model role used, e.g. `atlas.primary`; never a vendor name. */
    modelRole: text(),
    tokenInput: integer(),
    tokenOutput: integer(),
    latencyMs: integer(),
    createdAt: createdAt(),
  },
  (table) => [index("message_conversation_created_idx").on(table.conversationId, table.createdAt)],
);

export type ConversationRow = typeof conversation.$inferSelect;
export type MessageRow = typeof message.$inferSelect;
