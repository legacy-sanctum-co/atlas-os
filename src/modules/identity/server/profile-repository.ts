import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/core/db/client";
import { recordEvent } from "@/modules/events";

import type { ProfileUpdate } from "../domain/profile";
import { type UserProfileRow, userProfile } from "./schema";

export async function getProfile(userId: string): Promise<UserProfileRow | null> {
  const [row] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  return row ?? null;
}

/** Creates the profile row once, at owner bootstrap. Idempotent. */
export async function ensureProfile(userId: string, displayName: string): Promise<UserProfileRow> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(userProfile)
      .values({ userId, displayName: displayName.trim() || "Owner" })
      .onConflictDoNothing()
      .returning();
    if (!created) {
      const [row] = await tx
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId))
        .limit(1);
      if (!row) throw new Error("Profile creation failed");
      return row;
    }
    await recordEvent(
      { type: "profile.created", userId, actor: "system", subjectType: "user_profile" },
      tx,
    );
    return created;
  });
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<UserProfileRow> {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(userProfile)
      .set(patch)
      .where(eq(userProfile.userId, userId))
      .returning();
    if (!updated) throw new Error("Profile not found");
    await recordEvent(
      {
        type: "profile.updated",
        userId,
        subjectType: "user_profile",
        payload: { fields: Object.keys(patch) },
      },
      tx,
    );
    return updated;
  });
}
