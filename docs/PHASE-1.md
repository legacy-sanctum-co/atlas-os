# Atlas OS — Phase 1: The Atlas Core

Goal: prove the fundamental Atlas experience as **real software** — a private,
premium environment where the owner converses with a persistent Atlas that
remembers, knows the owner's ventures and projects, can act through
approved tools, and feels present across desktop and Galaxy Fold.

Phase 1 is a narrow, excellent vertical slice. Nothing decorative, nothing
fake.

## 1. In scope

| # | Capability | What "real" means |
| --- | --- | --- |
| 1 | Premium Atlas shell | Tokenized design system, three environment modes, Atlas indicator with real state, composer docked everywhere |
| 2 | Private account | Closed registration, email+password, passkeys, DB sessions, `requireSession()` everywhere |
| 3 | Atlas conversational intelligence | Personality + context assembly + AI SDK 7 streaming + multi-step tools |
| 4 | Streaming | UI message stream with parts (text, reasoning, tool), abort, error recovery, persisted on completion |
| 5 | Persistent memory | Core profile block, explicit `remember`, post-turn extraction into candidates, owner review, hybrid retrieval into context |
| 6 | Foundational data model | Tables in `docs/DATA-MODEL.md`, migrations committed, `atlas_event` spine |
| 7 | Command environment (home) | Composer + Atlas state + current focus + recent conversations + memory review queue + active projects. Only real data. |
| 8 | Ventures & projects context | CRUD, status/priority, focus selection, injected into Atlas context, readable/writable by tools with approval |
| 9 | Capability registry | `Capability` interface, registry, approval policy, `tool_invocation` audit; Operatives-ready |
| 10 | Responsive/foldable UX | `compact` / `portable` / `command`, posture + segment aware, tested in Playwright emulation and on device |
| 11 | Design system foundation | Tokens, primitives, motion vocabulary, shell |
| 12 | Production-quality repo | Strict TS, lint, unit + E2E tests, CI, ADRs, env validation, deploy to Vercel + Neon |
| 13 | Observability & security baseline | OTel + optional Langfuse, redacting logger, CSP/headers, crypto helper, audit events |
| 14 | Progressive onboarding (small, not a gate) | First run captures only: who you are, primary objectives, your ventures/major projects, how Atlas should interact with you. Each step skippable except a name. The owner enters the real environment within a minute; Atlas keeps learning through use (at most one gentle profile prompt per session) |

Phase 1 is a **single-owner private system**. Ownership boundaries (`user_id`)
are clean so multi-user is possible later, but no teams, invitations, roles,
organizations, shared workspaces, or collaboration UX are built.

Approved by the owner on 2026-09-19 with modifications recorded in ADRs
0003, 0008, 0009 and `docs/DESIGN-SYSTEM.md` (typography, responsive
strategy).

## 2. Explicitly not in Phase 1

| Deferred | Why | Seam preserved |
| --- | --- | --- |
| Daily Command Brief | Needs real signals (events, deadlines, integrations) to synthesize; a brief over three projects is a task list | `atlas_event` + memory + ventures; `command` module later |
| Operatives | Build the seam, not the workforce | Capability registry |
| Voice | High complexity; needs stable text core first | Composer abstraction, `/api/voice/session` design |
| Integrations (calendar, repos, health, finance) | Each is its own permission and data model | `integration` module reserved, `source='tool'` memories |
| Performance & Health, Creator Studio, Personal Command | Separate worlds; require encryption pattern and integrations | Module folders reserved; crypto helper shipped |
| Knowledge graph | pgvector + tsvector is sufficient at Phase 1 scale | `memory.entities` JSONB |
| Resumable streams / Redis | Not needed for a single owner yet | `conversation.active_stream_id` |
| Durable job engine | One short post-turn job suffices | `JobRunner` port |
| Document/artifact storage | Not required for conversation + memory | `artifact` table reserved |
| Multi-user / teams / collaboration | Single owner | `user_id` everywhere |
| WebGL / Three.js | Not justified; depth via layering and motion | none needed |
| AI Gateway dependency | Direct providers are simpler; not a dependency, env var, or code path in Phase 1 | `ModelRouter` roles |

Seams are preserved where they cost nothing (a `user_id` column, a port
interface, a registry). No speculative infrastructure is built for deferred
systems.

## 3. User journey (Phase 1)

1. **Enter.** Owner opens Atlas OS on desktop or Fold. Obsidian shell loads;
   sign-in with passkey (or password on first device).
2. **First run (under a minute).** Atlas asks, conversationally and
   skippably: what to call you, who you are in two sentences, your primary
   objectives, your ventures/major projects, and how you want Atlas to talk
   to you. Stored in `user_profile`/`venture`/`project`. Only the name is
   required; everything else can arrive later through normal use.
3. **Home / Command.** The composer is centered. Atlas indicator idle. Right
   rail shows: current focus (none yet), "What Atlas knows" (the profile
   block; no memories yet, stated plainly), active projects (empty state that
   invites the owner to tell Atlas about a venture).
4. **Establish context.** Owner types: "I run Legacy Sanctum; the main
   project right now is Atlas OS." Atlas proposes creating a venture and a
   project via tools → approval card → owner approves → rows created →
   right rail updates → `atlas_event`s emitted.
5. **Converse.** Owner discusses strategy. Atlas answers in character,
   candidly, with reasoning shown when useful. After the turn, extraction
   proposes two memory candidates ("Prefers decisions framed as trade-offs",
   "Atlas OS Phase 1 targets a narrow vertical slice"). They appear in the
   review queue; owner accepts one, rejects one.
6. **Return later on the Fold (closed).** Compact mode: composer bottom,
   conversation list one tap away. Owner asks "where did we land on the
   memory model?" Atlas retrieves the relevant memory and the earlier
   conversation window and answers with provenance.
7. **Unfold.** Shell transitions to portable mode; the context rail appears
   in the second segment with the project and the memories Atlas used.

## 4. Screens / environments

| Route | Environment | Notes |
| --- | --- | --- |
| `/sign-in`, `/sign-up` (allowlisted) | Entry | Passkey-first, password fallback |
| `/onboarding` | First run | Conversational four-step; skippable except name |
| `/` | Command (home) | Composer, Atlas state, focus, recent conversations, memory review count, active projects |
| `/c/[conversationId]` | Atlas conversation | Thread + composer + context rail (what Atlas used) |
| `/ventures`, `/ventures/[slug]` | Ventures | List/detail, projects within, edit forms, focus toggle |
| `/projects/[slug]` | Project | Detail, status/priority, next action, related conversations & memories |
| `/memory` | Memory | Active memories grouped by kind, candidate review queue, search, supersession history |
| `/settings` | Settings | Profile block editor, communication prefs, passkeys, sessions, model role display (read-only) |

Every route renders in all three environment modes.

## 5. Backend capabilities

- `POST /api/atlas/chat` — streaming turn: session → load → assemble → stream
  → persist → `after(extract)`.
- `POST /api/atlas/chat/[id]/abort` (or transport abort) — cancel stream.
- Server actions: ventures/projects CRUD, memory review (activate/reject/
  supersede), profile update, conversation rename/archive, focus set.
- `GET /api/health` — liveness (no secrets).
- Better Auth handler at `/api/auth/[...all]`.

## 6. AI capabilities (Phase 1 capability registry)

| id | risk | approval | Purpose |
| --- | --- | --- | --- |
| `memory.recall` | read | auto | Hybrid search over active memories |
| `memory.remember` | write | user | Store an explicit memory |
| `memory.supersede` | write | user | Replace an outdated memory |
| `ventures.list` / `ventures.get` | read | auto | Context lookup |
| `ventures.create` / `ventures.update` | write | user | Create/update venture |
| `projects.list` / `projects.get` | read | auto | |
| `projects.create` / `projects.update_status` | write | user | |
| `profile.update` | write | user | Update core block fields |
| `conversations.search_recent` | read | auto | Titles + summaries of recent conversations |

Orchestration: `streamText` with `stopWhen: isStepCount(5)`, `toolApproval`
policy from registry, `timeout` budgets, `telemetry.functionId: 'atlas.chat'`.

## 7. Design-system foundation deliverables

Tokens file · font loading · primitives listed in `docs/DESIGN-SYSTEM.md` ·
`Shell` with three modes · `AtlasIndicator` state machine (idle, listening,
thinking, streaming, committing, attention) · motion tokens · reduced-motion
handling · Storybook is **not** used; a `/design` route (dev-only) renders
primitives for visual review.

## 8. Dependencies (initial `package.json`)

Runtime: `next@16`, `react@19.3`, `react-dom@19.3`, `ai@7`, `@ai-sdk/react@4`,
`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/otel`, `@vercel/otel`,
`drizzle-orm@0.45`, `postgres@3`, `better-auth@1.7`,
`@better-auth/drizzle-adapter`, `@better-auth/passkey`, `zod@4`,
`@t3-oss/env-nextjs`, `motion@13`, `@base-ui-components/react` (or
`radix-ui`), `uuid` (v7) or `uuidv7`, `server-only`.

Dev: `typescript@6.0`, `eslint@10`, `typescript-eslint`, `eslint-plugin-jsx-a11y`,
`eslint-plugin-react-hooks`, `prettier`, `tailwindcss@4`, `@tailwindcss/postcss`,
`drizzle-kit@0.31`, `vitest@5`, `@vitejs/plugin-react`, `jsdom`,
`@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`,
`@playwright/test`, `vite-tsconfig-paths`.

Optional, only when the owner enables it (not installed by default):
`@langfuse/vercel-ai-sdk`, `@langfuse/otel`, `@sentry/nextjs`.

Not installed in Phase 1: `@ai-sdk/gateway`, Inngest/Workflow, Redis,
resumable-stream, mem0, LangChain/LangGraph, three.js, shadcn generator.

## 9. Implementation sequence

Each milestone ends green (`typecheck`, `lint`, `test`, `build`) and is
validated in the running app. **Milestones are executed sequentially with an
owner review after M1** before the Atlas intelligence experience (M3+) begins.

- [ ] **M0 — Repository foundation**
  - pnpm, Next.js 16 App Router (TypeScript, Tailwind 4, `src/`), TS 6.0 strict
    flags, ESLint flat config, Prettier, `.editorconfig`, `.nvmrc` (22),
    `.env.example`, `src/core/env.ts`, CI (GitHub Actions: install,
    typecheck, lint, test, build), Vercel project, Neon project, Docker
    compose for local `pgvector/pgvector:pg17`.
  - Folder skeleton per `docs/ARCHITECTURE.md` with `index.ts` barrels.
  - ADRs 0001–0006 committed. Make repo private.
- [ ] **M1 — Data and auth**
  - Drizzle client, first migration enabling `vector`, Better Auth tables
    via generator, `user_profile`, `atlas_event`, `emitAtlasEvent()`.
  - Better Auth config: allowlist, passkeys, sessions; `/api/auth/[...all]`;
    `requireSession()`; `proxy.ts` optimistic redirect.
  - Sign-in/sign-up/passkey enrollment screens (unstyled-but-tokenized).
  - Vitest: env schema, allowlist logic, repository isolation. Playwright:
    sign-in, blocked sign-up.
- [ ] **M2 — Design system core**
  - Tokens, fonts, primitives, `Shell` with three environment modes,
    `useEnvironmentMode()` (posture/segments/container/width), `AtlasIndicator`
    state machine, motion tokens, reduced motion. Dev-only `/design` route.
  - Playwright screenshots in compact/portable/command emulation.
- [ ] **M3 — Conversations and streaming**
  - `conversation`/`message` schema and repositories; `ModelRouter`;
    `atlas-instructions.ts`; `assembleAtlasContext()` v0 (profile + window);
    `/api/atlas/chat` with `streamText`, UI message stream, `onEnd` persist,
    usage capture; `useChat` thread UI with parts, abort, error states;
    title generation via `atlas.fast`; conversation list; OTel registration.
  - Vitest: instruction builder, context assembly, model router. Playwright:
    send message, see stream, reload shows persisted thread.
- [ ] **M4 — Ventures and projects**
  - Schema, repositories, server actions, screens, focus selection; injection
    into context; `atlas_event`s.
  - Capability registry + `ventures.*`/`projects.*` tools with approval
    flow (`toolApproval`, `ApprovalCard`, `addToolApprovalResponse`);
    `tool_invocation` audit.
  - Tests: registry policy, tool schemas, approval E2E.
- [ ] **M5 — Memory**
  - `memory` (tsvector) + `embedding_model` registry + `memory_embedding`
    (ADR 0009); embeddings via `atlas.embed` through `core/ai/embeddings`;
    hybrid ranking (pure, tested); `memory.recall`/`remember`/`supersede`
    tools; extraction job (`atlas.extract`, Zod output, idempotent via
    `memory_extracted_at`) through `JobRunner` (`after()` adapter); review
    queue UI; "What Atlas knows" rail; retrieved-memory citations in thread.
  - Tests: ranking fusion, supersession invariants, extraction idempotency,
    review E2E.
- [ ] **M6 — Command home and onboarding**
  - Home composition from real data; empty states that invite action, not
    placeholders; onboarding four-step; progressive prompt scheduler (max one
    per session).
  - Settings: profile block, prefs, passkeys, sessions, model roles (read-only).
- [ ] **M7 — Hardening and launch**
  - CSP/headers, rate limiting, redacting logger, crypto helper + tests,
    Langfuse env-gated, Sentry optional, `pnpm audit` clean, Lighthouse
    mobile pass on Fold profile, full Playwright suite in CI, production
    deploy, on-device validation on the Galaxy Fold (closed and open).

## 10. Acceptance criteria

Phase 1 is complete when all of the following are objectively true:

**Account & security**
- [ ] Only allowlisted emails can create an account; others get a generic error.
- [ ] Passkey sign-in works on desktop Chrome and on the Galaxy Fold.
- [ ] Every route under the shell redirects unauthenticated users; every
      server action and API route rejects requests without a valid session
      (verified by tests).
- [ ] Cross-user data access is impossible (repository tests with two users).
- [ ] CSP, HSTS, and the listed headers are present in production responses.
- [ ] No secret appears in client bundles (`next build` output scan).

**Atlas intelligence**
- [ ] A message streams token-by-token with visible Atlas state changes and
      can be aborted mid-stream.
- [ ] Atlas responds in the defined voice; the system instructions are in
      one file and covered by a snapshot test.
- [ ] Context assembly includes profile, focus, ranked memories, and window;
      unit tests cover ordering, caps, and empty states.
- [ ] Switching `atlas.primary` to another provider is a one-line change in
      `src/core/ai/models.ts` and the suite still passes.
- [ ] Every tool call is recorded in `tool_invocation`; write tools require
      approval and the approval is recorded.

**Memory**
- [ ] `remember` stores a memory with `source='user_explicit'`, embedding,
      and provenance.
- [ ] After a turn, extraction produces candidates that appear in the review
      queue; re-running extraction on the same message creates no duplicates.
- [ ] Accepting a candidate makes it retrievable; rejecting hides it; a
      superseding memory hides the superseded one from retrieval.
- [ ] Atlas answers a question that requires a memory from a previous
      conversation, citing it.

**Context**
- [ ] Ventures and projects can be created via UI and via approved tool calls;
      status changes emit `atlas_event`s.
- [ ] Setting a focus changes the assembled context (visible in the rail).

**Experience**
- [ ] All routes render correctly in `compact`, `portable`, and `command`
      modes in Playwright emulation, and on the physical Fold closed and open.
- [ ] In dual-segment emulation no interactive element spans the hinge.
- [ ] Lighthouse mobile (Fold profile): Performance ≥ 85, Accessibility ≥ 95.
- [ ] `prefers-reduced-motion` disables all non-essential motion.
- [ ] No UI element represents a capability that is not implemented.

**Engineering**
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` pass in CI on
      every commit to `main`.
- [ ] Playwright suite passes against the production build in CI.
- [ ] Every architectural decision has an ADR; `docs/` reflects what shipped.
- [ ] Production deployment on Vercel with Neon, preview deployments on PRs.
