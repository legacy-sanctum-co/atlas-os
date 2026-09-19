# ADR 0002 — Modular monolith on Next.js App Router

Status: Accepted · 2026-09-18

## Context

The long-term product has many "worlds" (Intelligence, Founder Command,
Operatives, Performance & Health, Creator Studio, Personal Command) sharing
one intelligence core. Splitting into services now would multiply auth,
deployment, and data-consistency work for a single owner.

## Decision

One Next.js application organized as vertical modules with enforced
dependency direction:

```
src/app      → routes only
src/design   → design system
src/modules  → identity · conversations · memory · ventures · intelligence
src/core     → env · db · auth · ai · crypto · events · jobs · observability
```

Each module: `domain/` (pure), `server/` (schema, repositories, use cases,
actions, tools), `ui/`. Public surface is `index.ts`. `core` never imports
modules. Boundaries are enforced with ESLint `no-restricted-imports` rules.

## Consequences

- Future worlds are new modules; the shell composes them.
- Domain logic is unit-testable without Next or a database.
- If a component ever needs independent scaling (e.g., an Operatives
  worker), it can be extracted along module lines with the `JobRunner` and
  `atlas_event` seams already in place.

## Alternatives considered

- **Microservices / separate API service**: premature; doubles auth and
  deploy surface.
- **Turborepo with `packages/*`**: adds tooling without a second deployable;
  revisit if a worker service or mobile app appears.
