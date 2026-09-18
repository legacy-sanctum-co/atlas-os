# Atlas OS Architecture

Atlas is a private Personal Intelligence Operating System. The product is the intelligence layer, not a collection of dashboards.

```
Owner
  ↓
Atlas (executive intelligence)
  ↓
Capabilities (tools now, Operatives later) / systems / automations
  ↓
Results, research, actions, monitoring
```

Atlas is the product identity. Anthropic, OpenAI, and any future model are adapters.

## 1. Shape of the system

Phase 1 is a **modular monolith**:

- one Next.js 16 application
- one PostgreSQL database
- one Atlas runtime on the server
- no microservices, no package monorepo, no Python sidecar

This can grow for years if the interior boundaries are real. Split a worker out only when background work fights the web request path.

```
src/
  app/                 HTTP routes and environments
  components/          shell, command, atlas surfaces
  design-system/       tokens, primitives, motion
  domain/              pure domain types and policies
  server/
    auth/              Better Auth + session helpers
    db/                Drizzle, schema, migrations
    dal/               user-scoped data access
    atlas/             runtime, router, context, memory, capabilities
    jobs/              after() now, durable jobs later
  infra/               env, logging, rate limits
```

Frontend code may render. It may not assemble Atlas context, retrieve memories, or talk to providers.

## 2. Recommended stack

| Concern | Choice | Why |
| --- | --- | --- |
| App | Next.js 16 App Router | Streaming, Server Components, one deployable OS shell |
| UI | React 19.3 | View Transitions for environment changes |
| Language | TypeScript strict | Long-lived personal system; `any` is a leak |
| Package manager | pnpm | Official AI SDK default; strict lockfile |
| Styling | Tailwind v4 as token engine + custom CSS | Speed without inheriting SaaS chrome |
| Motion | CSS + React View Transitions | State, not decoration; Fold-safe |
| Auth | Better Auth | Identity stays in our database |
| Access | Email allowlist | Private OS, not a SaaS |
| DB | PostgreSQL 15+ / Neon | Relational + pgvector in one system of record |
| ORM | Drizzle | SQL-shaped, vector columns, inferred types |
| AI SDK | AI SDK 7 | Streaming, tools, typed UI messages |
| Providers | Anthropic + OpenAI adapters | Direct providers; registry-owned routing |
| Embeddings | 1536-d (`text-embedding-3-small` or equal) | pgvector HNSW limit is 2000-d |
| Jobs | `after()` | Enough for post-turn memory; Inngest later |
| Tests | Vitest | Domain logic first |
| Hosting | Vercel + Neon, portable | Fast now, self-hostable later |

Rejected on purpose: Clerk, Auth.js as default, Prisma, Pinecone, LangChain/LangGraph, Mem0/Zep/Letta, shadcn, Three.js, Redis, Neo4j, public signup.

## 3. Atlas runtime

Every conversational turn, including a future voice turn, goes through one server pipeline.

```
HTTP POST /api/atlas/turn
  1. Authenticate session
  2. Load thread + owner scope
  3. Assemble context
  4. Select model
  5. Bind allowed capabilities
  6. streamText → UI message stream
  7. Persist user + assistant messages
  8. after(): extract / update memories
```

### 3.1 Constitution

A versioned server-only document defines Atlas: role, tone, what it must not do, and how it uses memory and tools. It is not a client prompt and not "the model."

### 3.2 Context assembler

Builds a bounded prompt from real records only:

1. Constitution
2. Profile and communication preferences
3. Pinned / active entities (projects, companies)
4. Retrieved memories (structured first, semantic second)
5. Recent thread messages
6. Current user turn

Never dump the entire history. Never inject fabricated memories to make the prompt look rich.

### 3.3 Model router

```ts
type AtlasTask =
  | "conversation"
  | "reasoning"
  | "memory_extract"
  | "embedding";

type ModelRef = {
  provider: "anthropic" | "openai";
  model: string;
};
```

Recommended defaults:

- conversation / reasoning → Anthropic (Sonnet-class; upgrade path to Opus-class)
- memory extraction → cheaper fast model
- embeddings → OpenAI 1536-d

The owner may later pin a conversational model in settings. The router, not the UI, resolves the provider client.

Do not use Vercel AI Gateway as the only path. It may be added as one provider later.

### 3.4 Capability registry

Tools and future Operatives share one contract:

```ts
type CapabilityKind = "tool" | "operative";

type Capability = {
  id: string;
  kind: CapabilityKind;
  description: string;
  inputSchema: unknown; // Zod schema at implementation
  permissions: string[];
  execute: (ctx: CapabilityContext, input: unknown) => Promise<unknown>;
};
```

Phase 1 ships only tools that do real work:

- `memory.write` — explicit remember
- `memory.invalidate` — explicit forget / supersede
- `entity.upsert` — create or update a project/company/goal
- `profile.update` — persist stated preferences or identity facts

No research operative, no browser agent, no code executor, no email sender.

A future Operative is a capability with `kind: "operative"`, its own system, and the same permission + audit envelope. Do not create a second orchestration framework.

### 3.5 Streaming

Use AI SDK UI message streams:

- `streamText`
- `convertToModelMessages`
- `toUIMessageStream` + `createUIMessageStreamResponse`
- `@ai-sdk/react` `useChat` on the client

The client renders `message.parts`. Tool calls that mutate state should appear as concise Atlas actions, not raw JSON theater.

### 3.6 Voice-ready constraint

Do not implement microphone, WebRTC, or TTS in Phase 1.

When voice arrives:

- browser captures audio
- server mints ephemeral credentials
- the voice transport emits the same `Conversation` / `Message` records
- memory extraction remains `after(turn)`
- Atlas constitution and tools stay server-side

Speech-to-speech must not become a second memory-less personality.

## 4. Memory architecture

Memory is a product feature and a data problem. It is not an embedding store with a prompt on top.

### Working memory

The active thread. Recent messages go into the model as conversation.

### Structured memory

Owner-editable records that Atlas should treat as true until changed:

- `Profile`
- `Entity` (company, brand, project, goal, idea)

These are first-class UI and first-class prompt context.

### Extracted memory

Atomic records produced after a turn or by explicit tool call:

- kind: `fact | preference | decision | commitment | insight`
- provenance: conversation + message ids
- confidence
- `validFrom` / `invalidAt`
- optional entity links
- optional embedding

Extraction policy:

1. Prefer structured entities when the owner is talking about a project or company.
2. Extract only durable facts, decisions, preferences, and commitments.
3. If a new memory contradicts an old one, invalidate the old one. Do not delete history.
4. Never extract health details, credentials, or secrets into free-text memory.
5. The owner can edit or invalidate any memory. Atlas does not argue with that.

### Semantic retrieval

Embeddings help when the owner asks in different words than were stored. They are secondary to structured filters (`userId`, `invalidAt is null`, entity, kind, recency).

Hybrid later (keyword + vector + temporal) is welcome. Graph traversal waits until there are enough real entities to make relations valuable.

### Inspection

A Memory surface lists real memories. If there are none, the surface says so. No sample memories.

## 5. Application environments

Atlas is entered, not browsed. Navigation exists to support intelligence.

Phase 1 environments:

| Environment | Role |
| --- | --- |
| Gate | Private sign-in. No marketing site. |
| First-run | Short progressive establishment of identity and current work. |
| Command | Home. Atlas is present. Brief uses only real data. |
| Intelligence | Full conversation surface. |
| Context | Profile, projects/entities, inspectable memory. |
| Settings | Account, model preference, danger zone. |

Future worlds (Founder Command, Operatives, Performance, Creator Studio, Personal Command) are **not** nav items with locked cards.

### Command brief philosophy

A brief is intelligence, not a task list. Phase 1 can only synthesize what Atlas owns:

- what the owner said they are working on
- unresolved decisions Atlas recorded
- stale or empty context Atlas needs
- the next useful question or action

It cannot mention inbox, calendar, workouts, or revenue unless those sources exist.

## 6. Frontend architecture

- Server Components for session-gated shells and first data read.
- Client Components for conversation, command input, and motion.
- Design tokens in CSS. Components consume tokens, not raw hex.
- Layout provider resolves `compact | command | expanded` and exposes it to the shell.
- Atlas presence is a persistent region, not a floating chat widget.

Foldable strategy:

1. Width / container queries as the reliable baseline.
2. Device Posture and Viewport Segments when the browser supports them.
3. Segment env vars to avoid painting critical chrome into a hinge.
4. Fold-closed = compact command. Fold-open = portable command center. Desktop = expanded OS.

See `docs/DESIGN.md`.

## 7. API architecture

Prefer Server Actions for ordinary mutations (profile, entity edits, memory edits).

Use Route Handlers for:

- `/api/auth/*` — Better Auth
- `/api/atlas/turn` — streaming intelligence
- future `/api/atlas/voice/session` — ephemeral voice credentials

All of them re-validate the session. None trust the client-supplied `userId`.

## 8. Jobs and events

Phase 1 event names exist even if only one consumer does:

- `atlas.turn.completed`
- `atlas.memory.extracted`
- `atlas.entity.changed`

`after()` handles extraction. A later Inngest/Trigger worker can subscribe to the same events for daily briefs, syncs, and Operative runs without rewriting the runtime.

## 9. Security posture

See `docs/SECURITY.md`.

Non-negotiables:

- allowlisted accounts
- database-backed sessions, HttpOnly cookies
- DAL isolation
- server-only secrets
- audit log for memory, entity, profile, and auth events
- no third-party analytics
- no PHI tables

## 10. Deployment

- Local: Next.js + Neon (or local Postgres with pgvector)
- Production: Vercel project + Neon database, same region
- Preview: Neon branch per PR when available
- Env via host secrets, never committed

Portability rule: if a feature requires a Vercel-only service, it does not belong in the core runtime.

## 11. Testing and observability

Test:

- allowlist and session gating
- DAL refuses cross-user reads
- memory extract/update/invalidate
- context assembler omits invalid memories
- router returns the expected ModelRef
- capability permission checks

Do not screenshot-test gold glows.

Log: request id, user id, conversation id, model ref, token usage, latency, tool ids. Never log message bodies or memory contents in production by default.
