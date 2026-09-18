# Phase 1 Data Model

PostgreSQL is the system of record. All owner data includes `user_id` and is accessed only through a scoped DAL.

Do not create tables for health, finance, workouts, operatives, or integrations in Phase 1.

## Identity (Better Auth)

Better Auth owns the core identity tables. Use the generated Drizzle schema rather than hand-rolling a parallel user model.

Expected core:

- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — token, userId, expiresAt, ipAddress, userAgent
- `account` — provider credentials / OAuth links
- `verification` — email verification and similar tokens

Application access control adds an allowlist check (`ATLAS_ALLOWED_EMAILS`) before session creation succeeds. That is policy, not necessarily a table.

## Profile

`profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | text unique | FK to `user.id` |
| preferred_name | text null | |
| headline | text null | How the owner describes their work |
| communication | jsonb | tone, brevity, challenge level |
| onboarding_status | text | `not_started \| in_progress \| complete` |
| onboarding_step | text null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

First-run writes this row progressively. Atlas may also update it via `profile.update` when the owner states a durable preference.

## Entities

`entities`

The first project/business context object. One table, typed, instead of fake modules.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | text | indexed |
| type | text | `company \| brand \| project \| goal \| idea` |
| name | text | |
| status | text | `active \| paused \| done \| archived` |
| priority | int null | owner or Atlas-assigned, always visible/editable |
| summary | text null | living brief, not a description dump |
| details | jsonb | type-specific fields, keep small |
| parent_id | uuid null | e.g. project → company |
| archived_at | timestamptz null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `(user_id, type, status)`, `(user_id, updated_at desc)`.

### Future graph hook

`entity_links` may be added when relations are real:

- `from_entity_id`, `to_entity_id`, `relation`, `valid_from`, `invalid_at`

Do not add it empty in Phase 1.

## Conversations

`conversations`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | text | |
| title | text null | derived, editable |
| status | text | `active \| archived` |
| last_message_at | timestamptz null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

`messages`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| conversation_id | uuid | |
| user_id | text | denormalized for isolation |
| role | text | `user \| assistant \| system` |
| parts | jsonb | AI SDK UI message parts |
| model_ref | text null | provider/model that produced it |
| created_at | timestamptz | |

Do not store provider API keys, hidden chain-of-thought, or raw request dumps on the message.

## Memories

`memories`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | text | |
| kind | text | `fact \| preference \| decision \| commitment \| insight` |
| content | text | atomic, one claim |
| confidence | real | 0–1, extraction only |
| source | text | `extraction \| explicit \| first_run` |
| source_conversation_id | uuid null | |
| source_message_id | uuid null | |
| entity_id | uuid null | optional link |
| valid_from | timestamptz | |
| invalid_at | timestamptz null | set when superseded |
| embedding | vector(1536) null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes:

- `(user_id, invalid_at, created_at desc)`
- HNSW on `embedding` with `vector_cosine_ops` (partial, where embedding is not null)

Invalid memories remain in the table for auditability. Retrieval excludes `invalid_at is not null`.

## Audit

`audit_events`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| user_id | text | |
| actor | text | `owner \| atlas \| system` |
| action | text | e.g. `memory.invalidate`, `auth.sign_in` |
| subject_type | text | |
| subject_id | text null | |
| metadata | jsonb | no secrets, no raw health, no tokens |
| created_at | timestamptz | |

Phase 1 writes audit rows for auth, profile changes, entity changes, memory writes/edits/invalidations, and model preference changes.

## Settings

Store owner model preference on `profiles.communication` or a tiny `owner_settings` jsonb column on `profiles`. Do not create a settings platform.

## Relationships

```
user 1──1 profile
user 1──* entities
user 1──* conversations 1──* messages
user 1──* memories
user 1──* audit_events
entity 1──* memories          (optional)
conversation 1──* memories    (as source)
```

## Retrieval rules

When assembling Atlas context:

1. Load profile.
2. Load active entities, most recently updated first, hard cap (e.g. 8).
3. Load valid memories: exact entity matches, then recent decisions/commitments, then semantic top-k.
4. Load the last N thread messages.
5. Drop anything invalidated, archived, or belonging to another user.

## What is intentionally absent

- health / wearable / supplement tables
- finance / metrics
- operative instances
- calendar / email objects
- document blobs
- notification inbox
- team / organization tenancy

The `user_id` column is the future tenancy key. Do not build orgs now.
