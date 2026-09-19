import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Applies pending SQL migrations from ./drizzle. Used locally and in CI;
 * production runs the same script during deploy. Never uses `push`.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => undefined });
  const db = drizzle(sql);
  const started = Date.now();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`migrations applied in ${Date.now() - started}ms`);
  await sql.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
