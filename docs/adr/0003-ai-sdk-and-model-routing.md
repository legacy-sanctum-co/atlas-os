# ADR 0003 — AI SDK 7 with role-based model routing

Status: Accepted · 2026-09-18

## Context

Atlas is a product identity; the model provider is infrastructure. Different
tasks (conversation, extraction, titling, embeddings) benefit from different
models, and providers will change over the product's life. We need
streaming, tool calling with approvals, structured output, telemetry, and an
upgrade path to multi-agent orchestration without a framework rewrite.

## Decision

- Use **AI SDK 7** as the only AI abstraction. `streamText`/`generateText`/
  `generateObject`/`embed` with `instructions`, `stopWhen: isStepCount(n)`,
  `toolApproval`, `timeout`, `telemetry`, `runtimeContext`, `toolsContext`.
- Introduce a **`ModelRouter`** in `src/core/ai/model-router.ts` that resolves
  *roles* to models:

```ts
export const MODEL_ROLES = {
  'atlas.primary': anthropic('claude-sonnet-4-6'),          // conversation, reasoning, tools
  'atlas.fast':    openai('gpt-5-mini'),                    // titles, classification
  'atlas.extract': anthropic('claude-haiku-4-5'),           // structured memory extraction
  'atlas.embed':   openai.textEmbeddingModel('text-embedding-3-small'), // 1536-dim
} as const;
```

  Exact model ids are configuration and will be set at implementation time
  from current provider catalogs; the roles are the contract.
- Modules request `router.resolve('atlas.primary')`; they never import
  provider packages.
- Personality lives in `src/modules/intelligence/domain/atlas-instructions.ts`
  and is rendered into `instructions` together with the assembled context.
- Orchestration in Phase 1 is a single `streamText` tool loop. The same
  registry-provided tools feed a `ToolLoopAgent`/`WorkflowAgent` later for
  Operatives.
- Telemetry: `registerTelemetry(new OpenTelemetry())` once in
  `instrumentation.ts`; every call sets `telemetry.functionId`.

## Consequences

- Swapping vendors is a one-file change; tests use a mock language model
  from `ai/test`.
- Vercel AI Gateway can be adopted by switching role values to string ids
  (`'anthropic/claude-…'`) and setting `AI_GATEWAY_API_KEY`; no code change
  elsewhere.
- The embedding dimension (1536) is pinned in the schema; changing embedding
  models requires a re-embed migration (documented in DATA-MODEL).

## Alternatives considered

- **Direct provider SDKs**: lose streaming UI protocol, tool approval, and
  cross-provider parity.
- **LangChain / LangGraph / Mastra**: additional abstraction over what AI
  SDK 7 already provides; heavier dependency surface.
- **Gateway-only from day one**: adds a network hop and a Vercel dependency
  for no Phase 1 benefit; kept as an option.
