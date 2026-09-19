# ADR 0009 — Embedding spaces are versioned infrastructure, not domain

Status: Accepted · 2026-09-19

## Context

The Phase 1 embedding provider happens to produce 1536-dimensional vectors.
Embedding models change often, dimensions differ between providers, and
pgvector HNSW indexes require a declared dimension. The owner has directed
that neither the provider nor the dimension become a permanent domain
assumption, and that re-embedding be a realistic operation.

## Decision

- The `memory` row is the canonical record. Embeddings are derived
  retrieval representations stored in `memory_embedding`, never on the
  memory row.
- `embedding_model` is a registry of every embedding space used: `provider`,
  `model`, `model_version`, `dimensions`, `status` (`active | retiring |
  retired`). Exactly one row is `active`.
- `memory_embedding` rows are keyed by `(memory_id, embedding_model_id)` and
  carry a `content_hash` so backfills are idempotent and unchanged content is
  not re-embedded.
- `src/core/ai/embeddings.ts` is the only place that knows provider, model,
  and dimension. It exposes `getActiveEmbeddingModel()` and `embed()`.
  The memory repository selects the physical table by the active model's
  dimensions (`memory_embedding_1536` in Phase 1; additional tables are
  created by migration when a space with a new dimension is activated).
- Re-embedding procedure: register new model (`active`), mark old
  (`retiring`), run backfill job in batches, switch retrieval when coverage
  is complete, drop old space, mark `retired`. Documented in
  `docs/DATA-MODEL.md`.
- The Phase 1 seed inserts exactly one `embedding_model` row describing the
  configured provider; `src/core/ai/models.ts` and the seed must agree, and
  a test asserts it.

## Consequences

- Switching from OpenAI embeddings to Anthropic, Voyage, or a local model is
  a config + migration + backfill task with no domain code change.
- One extra join at retrieval time; negligible at personal scale.
- Physical table-per-dimension is slightly unusual but is the only way to
  keep HNSW indexes while supporting different dimensions side by side.

## Alternatives considered

- **`vector` column without declared dimension**: cannot be HNSW-indexed;
  sequential scans at scale.
- **Truncate/pad vectors to a fixed size**: destroys retrieval quality across
  models.
- **Embedding on the memory row**: simplest, but couples the canonical
  record to infrastructure and makes side-by-side migration impossible.
