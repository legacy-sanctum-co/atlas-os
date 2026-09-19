/**
 * Event vocabulary. Dot-namespaced by module. Adding a type is additive;
 * renaming one is a migration of historical rows and should be avoided.
 */
export const ATLAS_EVENT_TYPES = [
  "system.bootstrap.completed",
  "auth.sign_in",
  "auth.sign_out",
  "auth.sign_up.denied",
  "auth.passkey.registered",
  "profile.created",
  "profile.updated",
  "venture.created",
  "venture.updated",
  "venture.archived",
  "project.created",
  "project.updated",
  "project.archived",
  "conversation.created",
  "conversation.archived",
  "message.sent",
  "memory.candidate.created",
  "memory.accepted",
  "memory.rejected",
  "memory.superseded",
  "capability.invoked",
  "capability.denied",
] as const;

export type AtlasEventType = (typeof ATLAS_EVENT_TYPES)[number];

export interface AtlasEventInput {
  type: AtlasEventType;
  userId?: string | null;
  subjectType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  actor?: "owner" | "atlas" | "system";
  requestId?: string;
}
