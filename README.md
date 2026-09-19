# Atlas OS

A private Personal Intelligence Operating System. One persistent
intelligence layer — Atlas — sits between its owner and everything else:

```
OWNER → ATLAS → operatives · tools · systems · automations → results
```

Atlas is the central executive intelligence: strategist, researcher,
operator, chief of staff, advisor, and confidant, expressed as one
intelligence rather than a set of chatbot personas.

## Status

**M0 (foundation) and M1 (application, data, auth) complete. Paused for
owner review before M2.**

What exists today: a production-quality repository, the migrated Postgres +
pgvector schema for every Phase 1 entity, single-owner authentication with
closed registration and passkeys, hardened HTTP headers with a nonce CSP,
the design-token system, and the three-mode environment shell verified at
five widths. What does not exist yet: Atlas conversation, memory extraction,
ventures UI, or anything simulated. See `docs/PHASE-1.md`.

## Documents

| Document | Purpose |
| --- | --- |
| `AGENTS.md` | Instructions for Cursor and other agents working in this repo |
| `.cursor/rules/` | Focused, auto-applied rules (philosophy, architecture, design, workflow, AI/memory, security) |
| `docs/ARCHITECTURE.md` | System architecture and module boundaries |
| `docs/PHASE-1.md` | Scope, user journey, screens, sequence, acceptance criteria |
| `docs/DATA-MODEL.md` | Entities and relationships |
| `docs/DESIGN-SYSTEM.md` | Visual language, tokens, motion, environment modes |
| `docs/SECURITY.md` | Security baseline and plan |
| `docs/RESEARCH-2026-09.md` | Research conclusions and verified versions |
| `docs/adr/` | Architecture decision records |

## Stack

Next.js 16 · React 19.3 · TypeScript 6.0 · Tailwind 4 · Motion 13 ·
AI SDK 7 · Drizzle · Postgres + pgvector (Neon) · Better Auth · Zod 4 ·
Vitest 5 · Playwright · pnpm · Vercel.

## Getting started

Requirements: Node 22 (`.nvmrc`), pnpm 10, and a Postgres 17 with the
`vector` extension available (local install, Docker `pgvector/pgvector:pg17`,
or a Neon branch).

```bash
corepack enable && pnpm install
cp .env.example .env.local   # fill in DATABASE_URL, BETTER_AUTH_SECRET, ALLOWED_OWNER_EMAILS
pnpm db:migrate              # applies ./drizzle (enables pgvector first)
pnpm dev                     # http://localhost:3000 → /sign-in → create the owner account
```

The first allowlisted email to sign up becomes the owner; registration is
sealed afterwards. Add a passkey from `/security`.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm verify` | typecheck · lint · format check · tests · build (what CI runs) |
| `pnpm test` | Vitest: unit + DOM; DB project runs when `TEST_DATABASE_URL`/`DATABASE_URL` is set |
| `pnpm test:e2e` | Playwright against a production build at five viewports |
| `pnpm db:generate` / `db:migrate` / `db:check` | Drizzle migrations (never `push`) |

## Principles

Never fake functionality. Atlas is central. Separate concerns. Model-agnostic
AI. Capabilities, not hardcoded tools. Security first. Strict TypeScript.
Buildable at every commit.
