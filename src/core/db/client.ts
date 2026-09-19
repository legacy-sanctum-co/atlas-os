import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/core/env";

import * as schema from "./schema";

/**
 * Single Drizzle client for the server. Uses the postgres-js driver over TCP,
 * which works identically against local Postgres and Neon (pooled URL).
 * Cached on globalThis so Next.js dev HMR does not leak connections.
 */

const globalForDb = globalThis as unknown as {
  __atlasSql: ReturnType<typeof postgres> | undefined;
};

const sql =
  globalForDb.__atlasSql ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // required for Neon's transaction-mode pooler
  });

if (env.NODE_ENV !== "production") globalForDb.__atlasSql = sql;

export const db = drizzle(sql, { schema, casing: "snake_case" });

export type Db = typeof db;
export { schema };
