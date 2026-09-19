import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

/** Time-ordered UUIDs generated in the application (docs/DATA-MODEL.md). */
export const id = () =>
  uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7());

export const createdAt = () =>
  timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());

export const archivedAt = () => timestamp({ withTimezone: true, mode: "date" });

export const nowSql = sql`now()`;
