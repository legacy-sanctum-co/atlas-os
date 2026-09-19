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

**Planning complete. Phase 1 implementation not yet started.**

Phase 1 delivers the Atlas Core: a premium shell across desktop and Galaxy
Fold, a private account, streaming Atlas conversation with persistent memory,
ventures/projects context, an auditable capability registry, and a
production-quality repository. See `docs/PHASE-1.md`.

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

## Getting started (after M0 lands)

```bash
corepack enable && pnpm install
cp .env.example .env.local   # fill in values
docker compose up -d          # local Postgres with pgvector
pnpm db:migrate
pnpm dev
```

## Principles

Never fake functionality. Atlas is central. Separate concerns. Model-agnostic
AI. Capabilities, not hardcoded tools. Security first. Strict TypeScript.
Buildable at every commit.
