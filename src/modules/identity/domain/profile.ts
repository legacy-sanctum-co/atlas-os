import { z } from "zod";

/**
 * Pure domain types for the owner's core profile block. These shapes are
 * stored as JSONB and validated at every write.
 */

export const communicationPrefsSchema = z.object({
  /** How much Atlas says by default. */
  verbosity: z.enum(["terse", "balanced", "thorough"]).optional(),
  /** How bluntly Atlas challenges ideas. */
  directness: z.enum(["measured", "direct", "blunt"]).optional(),
  /** Preferred answer structure. */
  format: z.enum(["prose", "structured", "mixed"]).optional(),
});
export type CommunicationPrefs = z.infer<typeof communicationPrefsSchema>;

export const prioritySchema = z.object({
  text: z.string().min(1).max(240),
  projectId: z.uuid().optional(),
});
export type Priority = z.infer<typeof prioritySchema>;

export const MAX_PRIORITIES = 7;

/** Which progressive onboarding prompts have been answered or skipped. */
export const onboardingStateSchema = z.object({
  identity: z.enum(["answered", "skipped"]).optional(),
  objectives: z.enum(["answered", "skipped"]).optional(),
  ventures: z.enum(["answered", "skipped"]).optional(),
  interaction: z.enum(["answered", "skipped"]).optional(),
  /** ISO timestamp of the last time Atlas asked a profile question. */
  lastPromptedAt: z.iso.datetime().optional(),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;

const IANA_TZ = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)*$/;

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1, "A name is required").max(80),
  timezone: z.string().regex(IANA_TZ, "Use an IANA timezone like Europe/London"),
  identitySummary: z.string().trim().max(2000).optional(),
  thinkingStyle: z.string().trim().max(2000).optional(),
  communicationPrefs: communicationPrefsSchema.optional(),
});
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
