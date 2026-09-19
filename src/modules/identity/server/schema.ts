import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { user } from "@/core/auth/schema";
import { createdAt, updatedAt } from "@/core/db/columns";

import type { CommunicationPrefs, OnboardingState, Priority } from "../domain/profile";

/**
 * The owner's always-in-context core memory block (docs/DATA-MODEL.md).
 * One row per user. Domain columns never go on the auth `user` table.
 */
export const userProfile = pgTable("user_profile", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text().notNull(),
  timezone: text().notNull().default("UTC"),
  identitySummary: text(),
  thinkingStyle: text(),
  communicationPrefs: jsonb().$type<CommunicationPrefs>().notNull().default({}),
  currentPriorities: jsonb().$type<Priority[]>().notNull().default([]),
  onboardingState: jsonb().$type<OnboardingState>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type UserProfileRow = typeof userProfile.$inferSelect;
export type NewUserProfileRow = typeof userProfile.$inferInsert;
