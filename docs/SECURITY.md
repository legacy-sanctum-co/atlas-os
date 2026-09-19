# Atlas OS — Security Baseline

Atlas OS will hold private business, personal, and eventually health data.
This document defines what is established in Phase 1 and what is planned.
No regulatory compliance (HIPAA, SOC 2, GDPR certification) is claimed.

## Phase 1 — established

### Identity and access

- Better Auth 1.7 with database sessions (not stateless JWT), Drizzle
  adapter.
- Registration closed: only emails in `ALLOWED_OWNER_EMAILS` may sign up.
  Everyone else receives a generic failure.
- Email + password (argon2/scrypt via Better Auth defaults) plus passkeys
  (`@better-auth/passkey`). Passkey enrollment prompted on first sign-in.
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, rotated on
  privilege change; 7-day expiry with sliding refresh; cookie cache signed.
- Rate limiting on auth endpoints (Better Auth built-in) and on
  `/api/atlas/*` (per-user token bucket, in-memory now, Redis later).

### Authorization

- `requireSession()` in every page, route handler, and server action.
- `proxy.ts` performs only an optimistic cookie-presence redirect; it is
  never the security boundary.
- Every repository method takes `userId` from the session and filters by it.
  Repository tests assert cross-user reads return nothing.

### Secrets and configuration

- `src/core/env.ts` validates all env vars at boot with Zod; the build fails
  on missing or malformed values. Only `NEXT_PUBLIC_*` is exposed to the
  client.
- `.env.local` gitignored; `.env.example` lists keys only.
- Provider API keys, database URL, auth secret, and data key are set in
  Vercel project env (production/preview) and never printed.

### Encryption

- In transit: HTTPS (Vercel), TLS to Neon (`sslmode=require`).
- At rest: Neon encrypts storage. Additionally, `src/core/crypto` ships
  application-level AES-256-GCM with:
  - 256-bit key from `ATLAS_DATA_KEY_V1` (base64), key version prefix stored
    with ciphertext to support rotation;
  - random 96-bit nonce per value; AAD = `table:column:rowId`;
  - `blindIndex(value)` = HMAC-SHA256 with a separately derived key for
    exact-match lookups;
  - unit tests for round-trip, tamper detection, and version dispatch.
  No Phase 1 column uses it yet; the helper exists so health/financial data
  never lands unencrypted.

### Database

- App connects with a role limited to DML on application tables; migrations
  run with a separate role via `drizzle-kit migrate` in CI/CD.
- Neon branch per preview deployment; production data never copied to
  previews (schema-only branches).

### AI boundary

- Tool inputs Zod-validated; identity comes from `toolsContext` (server),
  never from model output.
- `riskLevel: write | external` capabilities require explicit approval
  (`toolApproval: 'user-approval'`); approvals are recorded in
  `tool_invocation`.
- Prompts, memories, and message contents are never logged at info level.
  Telemetry to Langfuse is opt-in and self-hostable.
- **Provider data retention (owner directive):** use the most
  privacy-preserving, lowest-retention configuration each provider offers.
  Concretely: opt out of training/data-sharing programs at the organization
  level; request zero-data-retention where the provider grants it; never send
  identifying metadata beyond a hashed user identifier; keep prompts out of
  our own logs. The configured setting per provider is recorded in
  `src/core/ai/models.ts` comments and reviewed whenever a provider changes.
  Atlas OS may eventually hold business strategy, IP, financial context,
  health information, and private conversations; design every provider
  boundary as if it already does.

### HTTP hardening

- CSP with per-request nonce (`script-src 'nonce-…' 'strict-dynamic'`),
  `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`.
- HSTS (preload after first month), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: microphone=(self), camera=(), geolocation=()`.
- No third-party scripts in Phase 1.

### Auditability

- `atlas_event` records: sign-in/out, passkey add/remove, memory
  create/activate/supersede/reject, project status changes, tool executions
  and approvals, data exports.
- Retained indefinitely; owner-visible in a later "Activity" view.

### Repository hygiene

- Repo must be **private**. Until it is, nothing beyond `.env.example`
  (keys without values) and synthetic test data may be committed.
- Never commit secrets or production personal data. `.env*` is gitignored;
  CI uses repository secrets; a secret-scanning check runs in CI.
- Dependabot for dependency updates; `pnpm audit` in CI.
- No real personal data in fixtures or tests.

## Phase 2+ — planned

- Redis-backed rate limiting and resumable streams.
- Field-level encryption applied to health/financial modules with per-module
  key derivation; key rotation job.
- Integration permission model: per-integration scopes, revocation, and
  token storage encrypted with `src/core/crypto`.
- Tool sandboxing for Operatives that execute code or reach external
  systems; allowlisted egress.
- Data export and deletion tooling (full JSON export; cryptographic erasure
  by key destruction for encrypted modules).
- Security review of voice path (ephemeral token scope, safety identifier,
  microphone permission UX).
- Optional device-bound sessions (passkey-only sign-in) once the owner has
  two enrolled authenticators.
