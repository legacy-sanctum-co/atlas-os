import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { count } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import { db } from "@/core/db/client";
import { env } from "@/core/env";
import { logger } from "@/core/observability/logger";
// Composition root: auth lifecycle is the one place core reaches into modules.
import { recordEvent } from "@/modules/events";
import { bootstrapOwner } from "@/modules/identity/server/bootstrap";

import { decideSignUp } from "./access-policy";
import * as authSchema from "./schema";

const log = logger.child({ module: "auth" });

const appUrl = new URL(env.BETTER_AUTH_URL);
const isProduction = env.NODE_ENV === "production";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;

/**
 * Better Auth instance for the single owner (ADR 0005, docs/SECURITY.md).
 *
 * - Database sessions (not JWT) so revocation is immediate.
 * - Closed registration: sign-up passes only for an allowlisted address
 *   while no user exists. Afterwards the system is sealed.
 * - Email verification is not used: there is no email provider and the only
 *   account is created from the allowlist by the owner.
 * - Passkeys registered after sign-in; password remains as fallback.
 * - Telemetry disabled; nothing leaves the deployment.
 */
export const auth = betterAuth({
  appName: "Atlas OS",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [appUrl.origin],
  telemetry: { enabled: false },
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 256,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
    freshAge: 60 * 15,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: isProduction || appUrl.protocol === "https:",
    cookiePrefix: "atlas",
    database: { generateId: () => uuidv7() },
    defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const [row] = await db.select({ value: count() }).from(authSchema.user);
          const decision = decideSignUp({
            email: user.email,
            allowlist: env.ALLOWED_OWNER_EMAILS,
            existingUserCount: row?.value ?? 0,
          });
          if (!decision.allowed) {
            await recordEvent({
              type: "auth.sign_up.denied",
              actor: "system",
              payload: { reason: decision.reason },
            });
            log.warn("sign-up denied", { reason: decision.reason });
            throw new APIError("FORBIDDEN", {
              message: "Registration is closed.",
              code: "REGISTRATION_CLOSED",
            });
          }
          return { data: { ...user, email: user.email.trim().toLowerCase() } };
        },
        after: async (user) => {
          await bootstrapOwner({ userId: user.id, name: user.name });
        },
      },
    },
  },
  plugins: [
    passkey({
      rpID: appUrl.hostname,
      rpName: "Atlas OS",
      origin: appUrl.origin,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    }),
    // Must be last: lets server actions set cookies through Next.js.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
