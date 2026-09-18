# Architecture decisions

Short record of choices that future sessions should not reopen without cause. Challenge them if new evidence appears.

## ADR-001 — Modular monolith

**Decision:** One Next.js app, one Postgres, interior domain boundaries.

**Rejected:** Turborepo, separate API server, microservices, Python memory sidecar.

**Why:** A personal OS fails from scattered context, not from lack of independently scalable services. Split a worker only when jobs fight the web runtime.

## ADR-002 — Better Auth + allowlist

**Decision:** Self-hosted auth in our database. Email allowlist. No public signup.

**Rejected:** Clerk, Auth.js default, open registration.

**Why:** Identity for a private intelligence system should not live at a SaaS tenant. Public signup is an incident.

## ADR-003 — Owned memory, not a memory vendor

**Decision:** Structured memories with provenance and `invalid_at`, plus optional pgvector.

**Rejected:** Mem0, Letta, Zep/Graphiti as the system of record; Pinecone as a second brain.

**Why:** Changing facts need invalidation and inspection. Vendor memory hides the product's core loop.

## ADR-004 — AI SDK registry, not a single vendor or Gateway

**Decision:** AI SDK 7 + provider adapters + Atlas model router.

**Rejected:** Hard-coded OpenAI, LangChain, Vercel AI Gateway as the only model interface.

**Why:** Atlas is the product. Providers change. Gateway can be an adapter later.

## ADR-005 — No fake worlds

**Decision:** Phase 1 omits Operatives, health, studio, finance, voice I/O.

**Rejected:** Locked nav items, sample memories, sample metrics, sample workforce.

**Why:** Decorative completeness trains the team to lie to the owner.

## ADR-006 — Layout modes over gadget breakpoints

**Decision:** `compact | command | expanded`, with posture/segment APIs as progressive enhancement.

**Rejected:** A single Galaxy Fold media query as the responsive system.

**Why:** Fold is first-class; the web APIs are still uneven; the OS must work everywhere.

## ADR-007 — Design tokens, not a component kit

**Decision:** Custom tokens and primitives. Tailwind as implementation, not aesthetic.

**Rejected:** shadcn/ui, Daisy, generic admin kits, Three.js atmospheres.

**Why:** Those systems encode 2024 SaaS. Atlas cannot look rented.

## ADR-008 — Portable hosting

**Decision:** Vercel + Neon acceptable. No Vercel-only core dependencies.

**Rejected:** Welding the runtime to KV, Edge Config, Blob, or Gateway.

**Why:** A private OS may later need to live on a machine the owner controls.
