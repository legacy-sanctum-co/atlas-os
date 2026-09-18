# Research Conclusions

Research date: 18 September 2026. Primary documentation was preferred over tutorials. Tutorial architectures were treated as examples, not prescriptions.

## Workspace inspection

The repository contained only `README.md` (`# atlas-os`) on `main` at commit `5a46305`. No package files, source, environment config, or prior product work existed. There is nothing to preserve except the repo identity (`legacy-sanctum-co/atlas-os`).

## Application platform

**Next.js 16 (App Router) + React 19 + TypeScript** is the correct Phase 1 platform.

- Next.js 16.3.x is current stable. It is the production web stack with first-class streaming, Server Components, Route Handlers, and a Node-backed `proxy.ts` (formerly middleware).
- React 19.3 added stable View Transitions, which is the right motion primitive for environment changes. It is more appropriate than a 3D engine or ornamental page-load animation.
- Atlas is a private web operating environment first. A PWA can sit on the Fold later. A native Android/iOS app is not Phase 1.
- Node 22+ is required by the AI SDK. Use it from the start.

A separate backend framework (Nest, Fastify, Python) would split the product too early. A modular monolith inside Next.js is enough for years if domain logic is not dumped into components.

## AI interface

**Vercel AI SDK 7** is the right abstraction. It is not Atlas.

Material facts:

- Provider-agnostic `streamText` / `generateText` / tool calling / typed UI messages.
- Official Next.js path is `useChat` + `createUIMessageStreamResponse` / `toUIMessageStream`.
- `createProviderRegistry` and custom providers exist specifically so the product is not welded to one vendor.
- The official quickstart now defaults to **Vercel AI Gateway** and a single string model id.

**Challenge:** do not follow the Gateway-default tutorial. For a private OS, Atlas should own routing. Install provider adapters (`@ai-sdk/anthropic`, `@ai-sdk/openai`) and an internal registry. Gateway may become one adapter later. Atlas identity must not equal "whatever Gateway points at."

Do **not** use LangChain or LangGraph. They invert ownership: the framework becomes the agent, and Atlas becomes a thin prompt. Tool calling in the AI SDK is sufficient. Operatives later become capabilities in our registry, not a graph product.

## Memory

2026 memory research is consistent on one point: **memory is not RAG**.

- RAG is for relatively static reference material.
- Memory is for facts that change: decisions, priorities, preferences, commitments.
- Pure vector search will happily retrieve superseded facts.
- Strong systems extract atomic records, assign provenance, support ADD/UPDATE/INVALIDATE, and retrieve with more than cosine similarity.
- Temporal validity (`validFrom` / `invalidAt`) is more important than a knowledge-graph visualization.
- Graph memory (Zep/Graphiti, Mem0 graph) is useful later, not first.

**Challenge:** do not adopt Mem0, Letta, or Zep as the memory brain. They are excellent references and terrible owners of a private OS. We would import their data model, their extraction opinions, and usually another vendor. Own a small schema. Revisit graph layers when entities and decisions are real.

Phase 1 memory should be four layers, not one magic table:

1. Working thread (recent conversation)
2. Structured profile and entities (explicit, editable)
3. Extracted memory records with provenance and invalidation
4. Optional embeddings on those records for semantic recall

## Data

**PostgreSQL + Drizzle + pgvector** is the correct default.

- One database can hold relational context, conversations, memories, audit, and vectors.
- At personal-OS scale, pgvector HNSW is more than enough. Pinecone/Qdrant add a sync problem Atlas does not have.
- pgvector HNSW currently caps at 2000 dimensions. Use 1536-d embeddings (`text-embedding-3-small` or equivalent), not 3072-d large embeddings, until that limit changes.
- Drizzle stays close to SQL, has first-class `vector` columns, and infers types from TypeScript schema. Prisma is viable; it is not a better fit here.
- Neon is the recommended hosted Postgres: serverless, `vector` available, branch-per-PR. The architecture must still run against any Postgres 15+ with pgvector so self-hosting remains possible.

Do not add Redis, Neo4j, or object storage in Phase 1.

## Auth

**Better Auth**, not Clerk, not Auth.js.

- Atlas will hold unusually private data. Identity should live in our database.
- Better Auth is TypeScript-first, has a Drizzle adapter, email/password, future passkeys/2FA plugins, and Next.js 16 `proxy.ts` guidance.
- Clerk is faster to a pretty login screen and worse for a private OS: user records leave the building.
- Auth.js is maintenance-mode relative to Better Auth for greenfield work.

Authoritative session checks belong in the DAL / Route Handlers / Server Actions. `proxy.ts` may only do an optimistic cookie gate.

Phase 1 access should be **allowlisted**. This is not a SaaS. Public signup is a security bug.

## Voice

Browser voice in 2026 is real: OpenAI Realtime over WebRTC, plus AI SDK realtime hooks.

**Challenge:** do not build voice in Phase 1. Speech-to-speech can bypass the text memory bus if it is bolted on later. Phase 1 must put every turn through one conversation/memory pipeline so a future voice transport is another input mode, not a second brain.

## Foldables

Do not design "Galaxy Fold breakpoints."

W3C Device Posture (`continuous` | `folded`) and CSS Viewport Segments (`horizontal-viewport-segments`, `env(viewport-segment-*)`) are the correct primitives. They are still unevenly supported. Chrome is ahead; fallbacks are mandatory.

Architecture implication: first-class **layout modes** (`compact`, `command`, `expanded`) derived from width, container, and posture when available. Fold-closed, fold-open, and desktop become intentional experiences instead of accidental media queries.

## Design and motion

- A unique command aesthetic cannot start from shadcn or default Tailwind chrome. Those products look like 2024 SaaS regardless of color tokens.
- Tailwind v4 is acceptable as a **token implementation tool**, not as the visual language.
- React View Transitions + CSS for ambient state. Motion library only where CSS is insufficient.
- WebGL/3D is almost never justified for an OS shell. It reads as decoration, harms Fold performance, and fights accessibility.

## Jobs, realtime, observability

- Phase 1 memory extraction can use Next.js `after()` so the user is not blocked on extraction.
- Durable jobs (Inngest / Trigger.dev) wait until there are scheduled briefs, syncs, or long tool runs.
- SSE/UI message streams are enough. Do not add a general WebSocket layer until voice or live multi-surface sync needs it.
- No third-party product analytics in Phase 1. This is a private OS. Log server-side request ids and token usage only.

## Hosting

Vercel + Neon is the fastest production path for Next.js streaming. It is not a forever prison.

Hard rule: no Vercel-only products as load-bearing infrastructure (KV, Edge Config, Blob, AI Gateway as the only model path). Standard env, Postgres, and provider APIs only.

Self-host (Fly, Railway, VPS) remains a later option because the architecture is ordinary.

## What the research changed in the brief

The suggested Phase 1 list is mostly right. These changes are deliberate:

1. Daily Command Brief is real-data only. No email/calendar/health synthesis until those sources exist.
2. Voice is an architecture constraint, not a feature.
3. Operatives are a capability contract, not a workforce UI.
4. Memory is owned, structured, and inspectable — not a vector-only plugin.
5. No component library. No 3D.
6. Invite/allowlist, not public accounts.
7. One app, not a turborepo.
