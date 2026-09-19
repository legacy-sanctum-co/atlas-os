import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Better Auth core + passkey tables. Shape follows `npx auth generate` for
 * better-auth 1.7.5; ids are text (UUIDv7 via advanced.database.generateId).
 * Domain data never lives here — use `user_profile` (identity module).
 */

const ts = () => timestamp({ withTimezone: true, mode: "date" });

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: ts().defaultNow().notNull(),
  updatedAt: ts()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: ts().notNull(),
    token: text().notNull().unique(),
    createdAt: ts().defaultNow().notNull(),
    updatedAt: ts()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: ts(),
    refreshTokenExpiresAt: ts(),
    scope: text(),
    password: text(),
    createdAt: ts().defaultNow().notNull(),
    updatedAt: ts()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: ts().notNull(),
    createdAt: ts().defaultNow().notNull(),
    updatedAt: ts()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const passkey = pgTable(
  "passkey",
  {
    id: text().primaryKey(),
    name: text(),
    publicKey: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull(),
    counter: integer().notNull(),
    deviceType: text().notNull(),
    backedUp: boolean().notNull(),
    transports: text(),
    createdAt: ts(),
    aaguid: text(),
  },
  (table) => [
    index("passkey_user_id_idx").on(table.userId),
    index("passkey_credential_id_idx").on(table.credentialID),
  ],
);

export const authSchema = { user, session, account, verification, passkey };
