import type { z } from "zod";

/**
 * The single extension seam for everything Atlas can *do* (ADR 0006).
 * Tools in Phase 1; Operatives later implement the same contract.
 * This file defines the contract only; no capabilities are registered yet.
 */

export const TOOL_INVOCATION_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "denied",
] as const;
export type ToolInvocationStatus = (typeof TOOL_INVOCATION_STATUSES)[number];

export type CapabilityRisk = "read" | "write" | "external" | "destructive";

export interface CapabilityContext {
  userId: string;
  conversationId?: string;
  messageId?: string;
  /** Abort when the owner cancels the turn. */
  signal: AbortSignal;
}

export interface Capability<TInput = unknown, TOutput = unknown> {
  /** Stable, namespaced id, e.g. `ventures.list`. */
  id: string;
  description: string;
  risk: CapabilityRisk;
  /** Whether the owner must approve each execution. */
  requiresApproval: boolean;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute(input: TInput, context: CapabilityContext): Promise<TOutput>;
}

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, Capability>();

  register<TInput, TOutput>(capability: Capability<TInput, TOutput>): void {
    if (this.capabilities.has(capability.id)) {
      throw new Error(`Capability ${capability.id} is already registered`);
    }
    this.capabilities.set(capability.id, capability as Capability);
  }

  get(capabilityId: string): Capability | undefined {
    return this.capabilities.get(capabilityId);
  }

  list(): readonly Capability[] {
    return [...this.capabilities.values()];
  }
}
