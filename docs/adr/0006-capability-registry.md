# ADR 0006 — Capability registry as the single extension seam

Status: Accepted · 2026-09-18

## Context

Atlas must be able to act (create a project, store a memory) now, and later
delegate to specialized Operatives, integrations, and automations. We need
one mechanism that handles discovery, authorization, approval, auditing,
and execution for all of them, without deciding the Operatives design today.

## Decision

Define a `Capability` in `src/modules/intelligence/domain/capability.ts`:

```ts
interface Capability<In, Out> {
  id: `${string}.${string}`;           // e.g. 'memory.remember'
  description: string;                 // model-facing
  inputSchema: z.ZodType<In>;
  riskLevel: 'read' | 'write' | 'external';
  requiresApproval?: boolean;          // default: riskLevel !== 'read'
  execute(input: In, ctx: CapabilityContext): Promise<Out>;
}
```

`CapabilityContext` carries the authenticated `userId`, `conversationId`,
`messageId`, a scoped repository set, and an `emit()` for events. The
registry converts capabilities into AI SDK `tool()` definitions, builds the
`toolApproval` policy, injects context via `toolsContext`, records each call
in `tool_invocation`, and emits `tool.executed` events.

Operatives, when built, are capabilities whose `execute` runs a sub-agent
(`ToolLoopAgent`/`WorkflowAgent`) with its own instructions and tool subset.
Integrations register capabilities the same way. No second routing path is
permitted.

## Consequences

- Adding a tool is one file plus a registry entry and tests.
- Approval, audit, and identity handling are uniform and tested once.
- The model never receives raw repository access or user ids.

## Alternatives considered

- **Hardcoded tools in the chat route**: fast now, unmaintainable at ten
  tools, impossible for Operatives.
- **MCP servers for internal tools**: useful for external integrations
  later (AI SDK 7 supports MCP); overkill for in-process capabilities.
