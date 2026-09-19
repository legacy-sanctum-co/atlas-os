import { z } from "zod";

export const MEMORY_KINDS = [
  "fact",
  "preference",
  "goal",
  "decision",
  "insight",
  "relationship",
  "event",
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const MEMORY_STATUSES = ["candidate", "active", "superseded", "rejected"] as const;
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

/** Which state transitions are legal (ADD-only with supersession). */
const TRANSITIONS: Record<MemoryStatus, readonly MemoryStatus[]> = {
  candidate: ["active", "rejected"],
  active: ["superseded", "rejected"],
  superseded: [],
  rejected: [],
};

export function canTransition(from: MemoryStatus, to: MemoryStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const memoryInputSchema = z.object({
  kind: z.enum(MEMORY_KINDS),
  content: z.string().trim().min(3).max(2000),
  importance: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(0.7),
  sourceMessageId: z.uuid().optional(),
  ventureId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  entities: z.array(z.string().trim().min(1).max(120)).max(32).default([]),
});
export type MemoryInput = z.infer<typeof memoryInputSchema>;

/** Identifier for an embedding space; provider-neutral (ADR 0009). */
export interface EmbeddingSpace {
  id: string;
  provider: string;
  model: string;
  modelVersion: string | null;
  dimensions: number;
}

export function embeddingSpaceId(space: Omit<EmbeddingSpace, "id">): string {
  return `${space.provider}:${space.model}:${space.dimensions}`;
}
