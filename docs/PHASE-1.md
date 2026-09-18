# Phase 1 Scope

Phase 1 exists to prove the Atlas experience, not to sketch the eventual company.

**Success is a private, premium OS shell in which Atlas talks, remembers, retrieves, and advises from real owner context.**

If a screen cannot be backed by real data, it is not in Phase 1.

## What gets built

### 1. Production-quality repository

- Next.js 16 App Router, React 19, TypeScript strict, pnpm
- ESLint, Prettier, Vitest
- Drizzle + migrations
- `AGENTS.md` and Cursor rules (already established)
- `.env.example` with required secrets named, never valued
- Build, typecheck, and test scripts

### 2. Foundational design system

- Obsidian / gold / purple tokens
- Typography pair (editorial display, technical UI, mono)
- Shell primitives: viewport, panel, presence, command input, type stream
- Layout modes: `compact`, `command`, `expanded`
- Honest empty / loading / error states
- Reduced-motion support

No component library. No decorative 3D. No fake data visualizations.

### 3. Authenticated private account

- Better Auth with email/password
- Optional GitHub OAuth only if it can be allowlisted the same way
- `ATLAS_ALLOWED_EMAILS` gate; unknown emails are refused
- HttpOnly database sessions
- Optimistic `proxy.ts` cookie gate + authoritative DAL checks
- Sign-out

First user is still not a public signup flow. If the email is not allowlisted, the account is not created.

### 4. First-run (narrow)

A short progressive sequence, preferably conversational inside the shell, not a 40-field wizard:

1. What should Atlas call you?
2. What are you operating right now? (companies / projects in the owner's words)
3. What deserves attention this week?
4. How should Atlas speak to you? (brevity, challenge)

Each answer writes `profiles` and, where appropriate, `entities`. The owner can skip. Atlas continues learning from conversation.

### 5. Command environment

The home of the OS.

- Atlas is present and addressable
- A brief composed only from profile, entities, valid memories, and recent threads
- If the owner is new, the brief says so and asks the next useful question
- No inbox widgets, health rings, revenue tiles, or operative status

### 6. Atlas conversational intelligence

- Streaming responses
- Constitution-driven voice
- Context assembler (profile + entities + memories + thread)
- Provider registry + model router
- Persist every turn
- Capabilities: memory write/invalidate, entity upsert, profile update

Atlas may challenge, prioritize, and recommend. It may not invent business metrics or claim it checked systems it cannot see.

### 7. Persistent memory

- Post-turn extraction via `after()`
- Explicit remember / forget tools
- Memory inspector: list, edit, invalidate
- Retrieval into later turns
- Embeddings on extracted memories when an embedding key exists; degrade to structured retrieval if not

### 8. Project / business context

- Entity list and detail for `company | brand | project | goal | idea`
- Create from conversation or a minimal editor
- Atlas can reference and update summaries
- No kanban, no Gantt, no fake teammates

### 9. Settings

- Account email
- Sign out
- Conversational model preference (from an allowlisted set)
- Export/delete later can be stubbed as unavailable — do not fake export

### 10. Extension architecture (code, not product)

- Capability registry
- Event names for turn/memory/entity
- Layout mode hook that can read posture later
- Voice documented as a future transport into the same turn pipeline

## User journey

1. Owner opens Atlas. Unauthenticated users see the Gate — dark, quiet, no marketing.
2. Allowlisted owner signs in.
3. If profile onboarding is not complete, First-run starts. It can be dismissed into Command.
4. Command shows Atlas and a brief from whatever is actually known.
5. Owner speaks in text. Atlas streams a response.
6. After the turn, durable facts may become memories; projects may be upserted.
7. Later turns use those records. The owner can open Context and see the same records Atlas is using.
8. If nothing has been said yet, Atlas does not pretend there is a workforce, a health protocol, or a pipeline.

## Screens / environments

| Route idea | Environment | Real or omitted |
| --- | --- | --- |
| `/sign-in` | Gate | Real |
| `/first-run` | First-run | Real, skippable |
| `/` | Command | Real |
| `/intelligence` or Command-expanded thread | Intelligence | Real |
| `/context` | Context index | Real |
| `/context/projects/[id]` | Entity detail | Real |
| `/context/memory` | Memory inspector | Real |
| `/settings` | Settings | Real |
| Operatives | — | Omitted |
| Health | — | Omitted |
| Studio | — | Omitted |
| Finance | — | Omitted |

Exact paths can be adjusted during implementation. Do not add dead routes.

## Backend capabilities

- Session + allowlist
- CRUD for profile, entities, conversations, messages, memories
- Atlas turn endpoint with streaming
- Memory extraction job
- Embedding + hybrid-enough retrieval
- Audit writes
- Rate limit on the turn endpoint

## AI capabilities

- Streaming conversation in Atlas voice
- Use of real context
- Tool-assisted writes to memory/entities/profile
- Extraction of durable memories
- Refusal to fabricate connected-system knowledge

Not in Phase 1: deep research browsing, codebase agents, image generation, voice I/O, scheduled proactive outreach, multi-agent debate.

## Design-system foundation

See `docs/DESIGN.md`. Phase 1 must look like Atlas, not like a Tailwind template with gold swapped in.

Minimum delivered:

- color, type, elevation, motion tokens
- `AppShell`, `CommandInput`, `AtlasPresence`, `StreamText`, `Panel`
- compact / command / expanded layouts verified at phone, fold-like, and desktop widths

## Dependencies (expected)

Exact versions are resolved at bootstrap. Do not pin folklore versions in application code.

Runtime:

- `next`, `react`, `react-dom`
- `typescript`
- `ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `zod`
- `better-auth`, Drizzle adapter package as of install time
- `drizzle-orm`, `pg` or Neon serverless driver
- Tailwind v4 + PostCSS as generated by `create-next-app`

Dev:

- `drizzle-kit`, `vitest`, ESLint, Prettier

Do not add: LangChain, Clerk, Prisma, shadcn, Framer/Motion unless CSS is proven insufficient, Three.js, Redis, Inngest, PostHog, Mem0.

## Intentionally not built

- Atlas Operatives workforce and any fake roster
- Founder Command as a business suite
- Performance & Health, wearables, bloodwork, doctor summaries
- Creator Studio and generative media pipelines
- Calendar, email, Slack, bank, or repo integrations
- Real-time voice
- Daily brief from external signals
- Knowledge graph database
- Document vault / blob storage
- Notifications platform
- Teams, orgs, billing, public waitlist
- Native Android app
- 3D environments
- Marketing landing page
- "Coming soon" module galleries

## Acceptance criteria

Phase 1 is done only when all of the following are true:

1. A non-allowlisted email cannot create a session.
2. An allowlisted owner can sign in and sign out.
3. The shell renders as a premium command environment in compact, mid, and expanded widths without looking like a default dashboard.
4. First-run can persist a name, at least one entity, and a communication preference — or be skipped.
5. The owner can send a message and see a streamed Atlas reply.
6. The reply is recognizably Atlas (candid, tactical, not a generic assistant).
7. After a turn that states a durable fact ("Atlas OS is the priority this month"), a later new thread can use that fact without the owner repeating it.
8. The Memory inspector shows that fact, and the owner can invalidate it. After invalidation, Atlas no longer treats it as current.
9. The owner can create a project/entity and Atlas can refer to it by name.
10. Command brief contains only information present in profile, entities, memories, or threads. No invented metrics.
11. No Operatives, health, or finance UI exists.
12. Provider keys never appear in client bundles.
13. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed.
14. Domain tests cover isolation, memory invalidation, and model routing.
15. Empty states are empty.

## Implementation sequence

Execute `docs/IMPLEMENTATION-SEQUENCE.md` in order. Do not skip to a chat widget on a blank page and "design later."
