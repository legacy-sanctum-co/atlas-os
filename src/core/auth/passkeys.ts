import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/core/db/client";

import { passkey } from "./schema";

export async function listPasskeys(userId: string) {
  return db
    .select({
      id: passkey.id,
      name: passkey.name,
      deviceType: passkey.deviceType,
      backedUp: passkey.backedUp,
      createdAt: passkey.createdAt,
    })
    .from(passkey)
    .where(eq(passkey.userId, userId))
    .orderBy(desc(passkey.createdAt));
}
