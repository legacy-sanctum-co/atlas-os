import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Single source of truth for configuration. Validated once at boot; the build
 * fails on missing or malformed values. Only NEXT_PUBLIC_* reaches the client.
 *
 * Deferred systems (AI providers, observability backends) are added here when
 * their milestone lands, not before.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.url(),
    /** Comma-separated list of emails permitted to become the owner. */
    ALLOWED_OWNER_EMAILS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.length > 0),
      ),
    /** Base64 256-bit key for AES-256-GCM field encryption, version 1. */
    ATLAS_DATA_KEY_V1: z.string().optional(),
    ATLAS_DATA_KEY_CURRENT: z
      .string()
      .regex(/^v\d+$/)
      .default("v1"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ALLOWED_OWNER_EMAILS: process.env.ALLOWED_OWNER_EMAILS,
    ATLAS_DATA_KEY_V1: process.env.ATLAS_DATA_KEY_V1,
    ATLAS_DATA_KEY_CURRENT: process.env.ATLAS_DATA_KEY_CURRENT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
