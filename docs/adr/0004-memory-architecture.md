# ADR 0004 — Memory in Postgres with pgvector, ADD-only with owner review

Status: Accepted · 2026-09-18

## Context

Atlas must remember who the owner is, what has been decided, preferences,
goals, and commitments across sessions. The product forbids fake or silently
invented memory. Data is private. Scale is personal (thousands to low
hundreds of thousands of memories), not web-scale.

## Decision

Build a thin, owned memory layer on Postgres:

- **Tiers**: core block (`user_profile`, always in context, < ~1k tokens);
  semantic memories (`memory` table, retrieved); episodic (conversation
  messages, recent window now, searchable later); procedural (instructions).
- **Write model**: ADD-only. New information creates rows; contradictions
  create a superseding row (`supersedes_id`) and mark the old one
  `superseded`. Nothing is hard-deleted; rejection is a status.
- **Provenance**: every memory stores `source` and
  `provenance_message_id`. Extracted memories start as `candidate` and
  become `active` only when the owner accepts them in a review queue.
  Explicit `remember` calls (approved tool) become `active` immediately with
  `confidence = 1`.
- **Retrieval**: hybrid — pgvector cosine over `memory_embedding` (HNSW)
  fused with Postgres full-text over `memory.search` (tsvector, GIN),
  weighted by recency, importance, and confidence. Fusion is a pure function
  with unit tests. Top-k capped and rendered into context with ids for
  citation.
- **Canonical record vs. representation**: the `memory` row is canonical.
  Embeddings live in `memory_embedding`, keyed by `embedding_model` (provider,
  model, version, dimensions). Changing embedding models is a registry change
  plus a backfill, not a domain change (ADR 0009).
- **Extraction**: after each assistant turn, a job runs `atlas.extract` with
  a Zod output schema producing candidates with `kind`, `importance`,
  `entities`. Idempotent per message via `message.memory_extracted_at`.
- **Forgetting**: none in Phase 1 beyond supersession. Confidence decay and
  archival policies are Phase 2 with real usage data.

## Consequences

- No third-party memory service; privacy preserved; one database.
- The owner sees and controls what Atlas learns; the UI never shows
  memories that do not exist.
- Adding a knowledge graph later starts from `memory.entities` JSONB and
  dedicated edge tables; no rewrite.
- Embedding model changes are a registry entry + backfill job (ADR 0009);
  the domain never learns the dimension.

## Alternatives considered

- **Mem0 / Letta / Zep hosted**: sends private content to a vendor; less
  control over review semantics.
- **Dedicated vector DB (Pinecone, Qdrant)**: extra system for no benefit at
  personal scale; pgvector HNSW is adequate.
- **Silent auto-memory** (no review): faster, but violates the "no fake
  functionality" principle by asserting inferences the owner did not confirm.
