import { z } from "zod";

export const VENTURE_STAGES = [
  "idea",
  "building",
  "operating",
  "scaling",
  "paused",
  "exited",
] as const;
export type VentureStage = (typeof VENTURE_STAGES)[number];

export const VENTURE_STATUSES = ["active", "archived"] as const;
export type VentureStatus = (typeof VENTURE_STATUSES)[number];

export const PROJECT_STATUSES = ["planned", "active", "blocked", "done", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const name = z.string().trim().min(1).max(120);
const shortText = z.string().trim().max(280);
const longText = z.string().trim().max(8000);

export const ventureInputSchema = z.object({
  name,
  oneLiner: shortText.optional(),
  stage: z.enum(VENTURE_STAGES).default("building"),
  context: longText.optional(),
  goals: z.array(shortText.min(1)).max(12).default([]),
});
export type VentureInput = z.infer<typeof ventureInputSchema>;

export const projectInputSchema = z.object({
  name,
  ventureId: z.uuid().optional(),
  status: z.enum(PROJECT_STATUSES).default("active"),
  objective: longText.optional(),
  context: longText.optional(),
  nextStep: shortText.optional(),
  blockers: z.array(shortText.min(1)).max(20).default([]),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

/**
 * URL-safe slug derived from a name; unique per user (enforced in DB).
 * Pure so it can be unit-tested and reused for both ventures and projects.
 */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return base.length > 0 ? base : "untitled";
}

/** Appends a numeric suffix until the slug is not in `taken`. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("Could not derive a unique slug");
}
