# ADR 0007 — Background work behind a JobRunner port; defer durable engine

Status: Accepted · 2026-09-18

## Context

Phase 1 has exactly one asynchronous task: memory extraction after an
assistant turn (a single model call, seconds long). Later phases add a daily
brief (scheduled), integration syncs (event-driven), and Operative runs
(long, multi-step, approval-gated).

## Decision

- Define `JobRunner` in `src/core/jobs`:

```ts
interface JobRunner {
  enqueue<T extends JobName>(name: T, payload: JobPayload<T>): Promise<void>;
}
```

  Jobs are registered by name with a Zod payload schema and a handler.
- Phase 1 adapter: `AfterJobRunner` uses Next.js `after()` inside the route
  handler so extraction runs after the response is flushed. Handlers must be
  idempotent (extraction keys on `message.memory_extracted_at`).
- When durable scheduling or long runs are needed, add an adapter without
  changing call sites. Default choice after evaluation: **Inngest** (event
  functions map directly onto `atlas_event` types; step retries; cron).
  Alternatives kept open: Vercel Workflow DevKit (co-located, Vercel-native
  `"use workflow"`), Trigger.dev (long linear jobs).

## Consequences

- No queue infrastructure in Phase 1.
- `after()` has platform time limits; any job that can exceed ~60s must wait
  for the durable adapter.
- Job handlers are unit-tested independently of the runner.

## Alternatives considered

- **Install Inngest now**: more moving parts and a dev server for one short
  job.
- **Synchronous extraction in the request**: adds latency to every turn.
- **Vercel Cron only**: solves schedules, not event-driven or long jobs.
