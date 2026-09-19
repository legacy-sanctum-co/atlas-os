import "server-only";

import { count } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/core/db/client";

import { user } from "./schema";

/** True once the single owner account exists. Request-memoized. */
export const hasOwner = cache(async (): Promise<boolean> => {
  const [row] = await db.select({ value: count() }).from(user);
  return (row?.value ?? 0) > 0;
});
