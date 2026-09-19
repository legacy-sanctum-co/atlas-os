/**
 * Aggregated Drizzle schema. This is the only file drizzle-kit reads, and the
 * only place that knows about every module's tables. Modules own their own
 * `server/schema.ts`; core simply composes them.
 */
export * from "@/core/auth/schema";
export * from "@/modules/capabilities/server/schema";
export * from "@/modules/conversation/server/schema";
export * from "@/modules/events/server/schema";
export * from "@/modules/identity/server/schema";
export * from "@/modules/memory/server/schema";
export * from "@/modules/ventures/server/schema";
