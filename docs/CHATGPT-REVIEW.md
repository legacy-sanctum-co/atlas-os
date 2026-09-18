# Copy-paste review packet

Paste the block below into ChatGPT to review the plan before implementation.

---

```
ATLAS OS — PHASE 1 ARCHITECTURE REVIEW PACKET
Date: 2026-09-18
Repo: legacy-sanctum-co/atlas-os
Workspace status: empty except initial README. No existing app to preserve.

ARCHITECTURE
Owner → Atlas → capabilities (tools now, Operatives later) → results.
Modular Next.js 16 monolith. One Postgres. One server-side Atlas runtime.
Atlas is the product identity. Model vendors are adapters.
Every turn (including future voice) goes through: auth → context assembly → model route → tools → stream → persist → after() memory extraction.
Memory is structured + temporal (invalidate, not silent overwrite) + optional 1536-d embeddings. Not “RAG only,” not Mem0/Zep/Letta.

STACK (recommended)
- Next.js 16 App Router, React 19.3, TypeScript strict, pnpm, Node 22+
- Tailwind v4 as token engine + custom CSS (NO shadcn, NO default SaaS chrome)
- Motion: CSS + React View Transitions (NO Three.js)
- Better Auth (DB sessions) + ATLAS_ALLOWED_EMAILS allowlist (NO Clerk)
- PostgreSQL / Neon + Drizzle + pgvector (NO Pinecone, NO Neo4j)
- AI SDK 7 + @ai-sdk/anthropic + @ai-sdk/openai (NO LangChain, NO Gateway lock-in)
- Jobs: Next after() only in Phase 1 (Inngest later)
- Host: Vercel + Neon, portable (no Vercel KV/Blob/Gateway as core)
- Tests: Vitest on domain logic

PHASE 1 (build this)
1. Premium Atlas shell with compact / command / expanded layout modes
2. Allowlisted private auth
3. Short first-run (name, current work, weekly attention, communication preference)
4. Streaming Atlas conversation with constitution + real context
5. Persistent conversations
6. Structured profile + entities (company/brand/project/goal/idea)
7. Extracted memories with provenance, invalidation, inspector, retrieval
8. Tools: memory.write, memory.invalidate, entity.upsert, profile.update
9. Command home brief from REAL Atlas-owned data only
10. Settings: account, model preference, sign out
11. Capability registry + event names for later Operatives/jobs
12. Security headers, rate limit, audit log, userId isolation tests

NOT YET
Operatives workforce UI, Founder Command suite, health/performance, creator studio, calendar/email/bank/repo integrations, realtime voice, graph DB, document vault, notifications platform, teams/billing, public marketing site, native apps, 3D, fake metrics.

IMPORTANT DECISIONS (please confirm or override)
1. Invite/allowlist only — public signup is treated as a bug.
2. Better Auth over Clerk because identity and future private data must stay in our DB.
3. Own memory schema; do not adopt Mem0/Letta/Zep.
4. Direct provider SDKs + internal router; do not default to Vercel AI Gateway.
5. Default conversation model: Anthropic. Embeddings: OpenAI 1536-d (pgvector HNSW dim limit).
6. No voice implementation in Phase 1; architecture must keep one memory bus.
7. No shadcn / no decorative WebGL.
8. Daily brief synthesizes only profile, entities, memories, threads — not imaginary inbox/health/revenue.
9. Single app, not a turborepo or microservice mesh.
10. Do not claim HIPAA/SOC2. Phase 1 has no health tables.

QUESTIONS / DISAGREEMENTS
- Official AI SDK quickstart pushes Gateway + string model IDs. We reject that as the core path for a private OS.
- Suggested Phase 1 “Daily Command Brief” is too strong if it implies cross-system awareness. We narrowed it to Atlas-owned context.
- “Masculine luxury” can collapse into bro-cyber or cologne-ad. Visual rule is restraint, scarce gold/purple, no glow spam.
- Foldable Device Posture / Viewport Segments are real but uneven. Layout modes + CSS fallbacks are mandatory; Fold-specific pixel breakpoints are not.
- Clerk would get a prettier login faster and is the wrong privacy trade.
- Building Operatives, health, or voice now would create fake surfaces and a second brain. We refuse that.

APPROVAL NEEDED BEFORE IMPLEMENTATION
- Accept allowlist + Better Auth + Neon/Drizzle + AI SDK router plan
- Confirm Anthropic as default conversational provider (requires API key)
- Confirm OpenAI (or alternative) for embeddings
- Confirm Vercel+Neon for first deploy vs self-host first
- Confirm no public marketing site
- Confirm owner email(s) for ATLAS_ALLOWED_EMAILS when implementation starts

DO NOT START BROAD IMPLEMENTATION UNTIL THIS PACKET IS ACCEPTED.
Authoritative repo docs: AGENTS.md, docs/ARCHITECTURE.md, docs/PHASE-1.md, docs/IMPLEMENTATION-SEQUENCE.md.
```
