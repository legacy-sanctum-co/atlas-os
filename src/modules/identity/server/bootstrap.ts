import "server-only";

import { logger } from "@/core/observability/logger";
import { recordEvent } from "@/modules/events";

import { ensureProfile } from "./profile-repository";

const log = logger.child({ module: "identity" });

/**
 * Runs once, immediately after the owner account is created by auth.
 * Establishes the profile row and records the bootstrap event. Idempotent so
 * a retried sign-up cannot duplicate anything.
 */
export async function bootstrapOwner(input: { userId: string; name: string }): Promise<void> {
  await ensureProfile(input.userId, input.name);
  await recordEvent({
    type: "system.bootstrap.completed",
    userId: input.userId,
    actor: "system",
    subjectType: "user",
  });
  log.info("owner bootstrap completed");
}
