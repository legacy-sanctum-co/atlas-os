# Atlas OS — System Architecture

Status: Approved for Phase 1 · Last updated: 2026-09-18

## 1. Shape of the system

Atlas OS is a **modular monolith**: a single Next.js 16 application with
strict internal module boundaries, one Postgres database, and one AI
abstraction layer. This is deliberate. A personal system with one owner does
not need microservices; it needs clean seams so that memory, tools,
Operatives, voice, and integrations can be added without rewriting the core.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Clients: Desktop browser · Galaxy Fold (closed / open) · future voice   │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ HTTPS · SSE streams · (WebRTC later)
┌──────────────────────────────▼───────────────────────────────────────────┐
│  Next.js 16 App Router (Vercel, Node runtime)                            │
│                                                                          │
│  src/app         routes, layouts, route handlers (thin)                 │
│  src/design      design system: tokens · primitives · shell · motion     │
│  src/modules     identity · conversations · memory · ventures ·          │
│                  intelligence  (domain / server / ui per module)         │
│  src/core        env · db · auth · ai · crypto · events · jobs · otel    │
└───────┬────────────────────┬──────────────────────┬──────────────────────┘
        │                    │                      │
┌───────▼───────┐   ┌────────▼────────┐    ┌────────▼────────────────────┐
│ Postgres +    │   │ Model providers │    │ Observability               │
│ pgvector      │   │ via AI SDK 7    │    │ OpenTelemetry → Langfuse    │
│ (Neon)        │   │ (Anthropic,     │    │ (self-hostable, optional)   │
│               │   │  OpenAI, ...)   │    │                             │
└───────────────┘   └─────────────────┘    └─────────────────────────────┘
```

## 2. Layers and dependency rules

| Layer | Path | May import | Purpose |
| --- | --- | --- | --- |
| Routes | `src/app` | modules, design, core | Compose modules into screens and API routes. No business logic. |
| Design | `src/design` | core/env (client-safe only) | Tokens, primitives, shell, motion, environment-mode hooks. |
| Modules | `src/modules/<name>` | own domain, core, other modules' `index.ts` | Vertical domain slices. |
| Core | `src/core` | third-party only | Infrastructure ports and adapters. Never imports modules. |

Each module has three folders:

- `domain/` — pure TypeScript: types, Zod schemas, ranking, assembly,
  invariants. No I/O. Fully unit tested.
- `server/` — Drizzle schema, repositories, use cases, server actions, tool
  definitions. Runs only on the server.
- `ui/` — React components (server and client), hooks. No direct DB access.

A module exposes a single `index.ts`. Cross-module imports go through it.

## 3. Modules (Phase 1)

| Module | Owns | Key surfaces |
| --- | --- | --- |
| `identity` | Better Auth wiring, `user_profile` (core memory block), preferences, onboarding state | Sign-in, passkeys, profile, progressive onboarding prompts |
| `conversations` | `conversation`, `message`, stream lifecycle, titles | Atlas conversation view, history list |
| `memory` | `memory`, extraction, retrieval/ranking, review queue | "What Atlas knows" panel, candidate review |
| `ventures` | `venture` (company/brand), `project`, status/priority | Context registry, project detail |
| `intelligence` | Atlas instructions, context assembly, capability registry, orchestration, `tool_invocation` | `/api/atlas/chat` route handler, tool UI parts |

Future modules slot in beside them without touching the core:
`operatives`, `performance`, `studio`, `command` (daily brief),
`integrations`, `voice`.

## 4. Core infrastructure (`src/core`)

| Package | Responsibility | Phase 1 implementation |
| --- | --- | --- |
| `env` | Typed, validated environment | `@t3-oss/env-nextjs` + Zod |
| `db` | Drizzle client, aggregated schema, migrations | `postgres` driver, Neon, pgvector |
| `auth` | Better Auth instance, `requireSession()`, allowlist | Email+password, passkeys, DB sessions |
| `ai` | `ModelRouter` (roles → models), embeddings, telemetry registration | `@ai-sdk/anthropic`, `@ai-sdk/openai`; gateway optional |
| `crypto` | AES-256-GCM field encryption, blind index, key versions | Node `crypto`, env-held key |
| `events` | `emitAtlasEvent()` writes `atlas_event`; in-process subscribers | Postgres table; later: durable bus |
| `jobs` | `JobRunner` port: `enqueue(job)` | `after()` adapter now; Inngest/Workflow adapter later |
| `observability` | OpenTelemetry setup, logger with redaction | `instrumentation.ts`, `@ai-sdk/otel`, optional Langfuse |

## 5. Atlas intelligence architecture

```
user message
   │
   ▼
/api/atlas/chat (route handler, requireSession, Zod)
   │
   ├─ load conversation + UIMessages (conversations)
   ├─ assembleAtlasContext()  ← profile · ventures/projects · ranked memories
   │                             · recent window            (pure, intelligence/domain)
   ├─ buildInstructions(context)  ← personality + context blocks
   ├─ capabilities.forUser(session) → AI SDK tools (+ approval policy)
   │
   ▼
streamText({ model: router.resolve('atlas.primary'), instructions, messages,
             tools, stopWhen: isStepCount(5), toolApproval, timeout, telemetry })
   │
   ├─ UI message stream → client (useChat, parts rendering, tool UI)
   └─ onEnd → persist assistant UIMessage
             → emit atlas_event('conversation.turn.completed')
             → jobs.enqueue(extractMemories(messageId))   [after()]
```

Key properties:

- **Atlas is the product; models are infrastructure.** `ModelRouter` maps
  roles to provider models in one file. The personality lives in one file.
- **Context is assembled, not accumulated.** A small always-present core
  block (profile, communication preferences, active priorities) plus
  retrieved memories and ventures/projects relevant to the message.
- **Capabilities are the only extension seam.** Tools, and later Operatives,
  are `Capability` objects registered in one registry with risk levels and
  approval policies. Orchestration never hardcodes tool names.
- **Everything is auditable.** Every tool call → `tool_invocation`; every
  significant event → `atlas_event`.

### Model roles (initial mapping, `src/core/ai/models.ts`)

| Role | Purpose | Initial choice | Notes |
| --- | --- | --- | --- |
| `atlas.primary` | Conversation, reasoning, tool use | Anthropic Claude (current Sonnet-class) | Best fit for candid, structured reasoning; swap freely |
| `atlas.fast` | Titles, classification, cheap steps | OpenAI small model or Anthropic Haiku-class | Latency/cost |
| `atlas.extract` | Structured memory extraction (Zod output) | Same family as primary, smaller tier | Determinism over creativity |
| `atlas.embed` | Embeddings | OpenAI `text-embedding-3-small` (1536-dim) | Provider, model, version, and dimension are recorded in the `embedding_model` registry; changing them is config + backfill (ADR 0009) |

These are infrastructure configuration. Atlas is provider-independent by
construction: no module, prompt, schema, or UI references a vendor. A
gateway could later be adopted through the same router; it is a confirmed
Phase 1 deferral and not a dependency.

## 6. Memory architecture

Tiered, following current production patterns (Letta/MemGPT tiers, Mem0
ADD-only extraction, hybrid retrieval):

| Tier | Storage | In context? | Phase 1 |
| --- | --- | --- | --- |
| Core | `user_profile` (identity, how the owner thinks, communication prefs, current priorities) | Always (< 1k tokens) | Yes, editable by owner and by Atlas via `update_profile` (approval) |
| Semantic | `memory` rows: facts, preferences, decisions, goals, commitments, context | Retrieved | Yes |
| Episodic | `message` history per conversation | Recent window + retrievable by search later | Yes (window); episodic search Phase 2 |
| Procedural | Atlas instructions + owner-defined rules | Always | Instructions only; owner rules Phase 2 |

Rules: ADD-only with supersession, provenance on every row, candidate →
active via owner review, hybrid retrieval (pgvector HNSW cosine + Postgres
`tsvector`), recency/importance weighting, extraction as an idempotent
background job. The `memory` row is canonical; embeddings are derived
representations stored per embedding space (`embedding_model` registry +
`memory_embedding`, ADR 0009). Forgetting policy (confidence decay,
archival) is Phase 2.

## 7. Data platform

- Postgres 17 on Neon (serverless, branching for previews, pgvector
  included). Drizzle 0.45 stable for schema, migrations, and queries.
- Single database, single schema, `user_id` on every owned table. Multi-user
  is not a Phase 1 goal, but the model does not preclude it.
- JSONB for `message.parts` (AI SDK `UIMessage` parts) and for flexible
  metadata; typed columns for everything queried.
- `atlas_event` is the append-only audit/event spine.

## 8. Streaming and realtime

- Chat streaming uses AI SDK UI message streams over SSE from a Node route
  handler. Client uses `useChat` + `DefaultChatTransport`.
- Resumable streams (`resumable-stream` + Redis) are designed for but not
  installed in Phase 1; `conversation.active_stream_id` exists so it can be
  added without a migration.
- Server-pushed realtime (notifications, background job status) is Phase 2:
  SSE endpoint first, WebSockets only if needed.

## 9. Voice-ready architecture

- The composer is a command surface, not a text field. Conversation state is
  independent of input modality.
- Planned path: OpenAI Realtime API over WebRTC. `/api/voice/session` mints
  ephemeral client secrets server-side (`POST /v1/realtime/client_secrets`)
  with `OpenAI-Safety-Identifier` bound to the hashed user id. The browser
  never sees the API key. Voice tool calls reuse the capability registry
  through a server-side bridge.
- Alternative (if a non-OpenAI primary is preferred for voice): STT → Atlas
  (`atlas.primary`) → TTS pipeline through the same route handler.

## 10. Background work

Phase 1 needs one post-response job (memory extraction, well under 60s) and
no schedules. Next.js `after()` covers this behind the `JobRunner` port.
When the Daily Command Brief, integrations, or Operatives arrive, the port
gets a durable adapter. Evaluation done: Inngest (event-driven, fits the
`atlas_event` model), Vercel Workflow DevKit (co-located, Vercel-native),
Trigger.dev (long linear jobs). Default pick when needed: Inngest.

## 11. Observability

- `instrumentation.ts` registers OpenTelemetry via `@vercel/otel` and
  `registerTelemetry(new OpenTelemetry())` from `@ai-sdk/otel`.
- Optional Langfuse (self-hostable, MIT) via `@langfuse/vercel-ai-sdk` when
  `LANGFUSE_*` env is present. Traces include `functionId` per call.
- Structured logger with automatic redaction of prompts, memories, and
  secrets at info level.
- Error tracking: Sentry (`@sentry/nextjs`) is approved but optional in
  Phase 1.

## 12. Deployment

- Vercel for the app (Node runtime; Fluid compute), Neon for Postgres.
  Preview deployments get Neon branches.
- `output: 'standalone'` is kept working so the app can move to a container
  host (Fly, Railway, own VPS) without code changes if privacy or cost
  demands it.
- Environments: `local` (Docker `pgvector/pgvector:pg17`), `preview`,
  `production`. Secrets live in Vercel env / local `.env.local` only.

## 13. Extension points reserved for later

| Future capability | Seam that already exists after Phase 1 |
| --- | --- |
| Operatives | `Capability` registry + `atlas_event` + `JobRunner` |
| Daily Command Brief | `atlas_event` stream + memory + ventures; a `command` module reads them |
| Integrations (calendar, repos, health) | `integration` module writing `atlas_event`s and memories with `source='tool'` |
| Voice | Composer abstraction + `/api/voice/session` + capability bridge |
| Multi-device notifications | SSE endpoint + `atlas_event` subscribers |
| Knowledge graph | `memory.entities` JSONB now; dedicated `entity`/`edge` tables later |
| Multi-user / shared workspaces | `user_id` everywhere; add `workspace_id` when needed |
