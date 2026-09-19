# Atlas OS — Security Baseline

Atlas OS will hold private business, personal, and eventually health data.
This document defines what is established in Phase 1 and what is planned.
No regulatory compliance (HIPAA, SOC 2, GDPR certification) is claimed.

## Phase 1 — established

### Identity and access

- Better Auth 1.7 with database sessions (not stateless JWT), Drizzle
  adapter.
- Registration closed (`src/core/auth/access-policy.ts`, unit-tested): sign-up
  succeeds only for an email in `ALLOWED_OWNER_EMAILS` **and** while no user
  exists. Once the owner exists the system is sealed for everyone (403
  `REGISTRATION_CLOSED`); each denial is recorded in `atlas_event`.
- Email + password (scrypt via Better Auth default, 12-char minimum) plus
  passkeys (`@better-auth/passkey`, `residentKey: preferred`,
  `userVerification: preferred`), managed at `/security`.
- Session cookies: prefix `atlas.`, `HttpOnly`, `SameSite=Lax`, `Secure`
  whenever the base URL is https; 14-day expiry with 1-day rolling refresh;
  cookie cache disabled so every request is validated against the database
  and sign-out revokes immediately (verified: session row deleted).
- Rate limiting (Better Auth built-in): 30 req/min per IP on auth routes,
  5/min on `/sign-in/email`, 3/min on `/sign-up/email`.
- Better Auth telemetry disabled; Next.js telemetry disabled.
- Ids are UUIDv7 generated in the application.

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

- Migrations are SQL files under `drizzle/` applied by `pnpm db:migrate`
  (`drizzle-orm` migrator); `drizzle-kit push` is never used. CI applies
  them to a fresh `pgvector/pgvector:pg17` and runs `drizzle-kit check`.
- Every owned table carries `user_id` with `ON DELETE CASCADE` to `user`.
- Planned (owner action, not yet in place): split DML role vs. migration
  role on Neon; Neon branch per preview deployment with schema-only data.

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

- CSP built per request in `src/proxy.ts` via `src/core/security/csp.ts`
  (unit-tested): `script-src 'self' 'nonce-…' 'strict-dynamic'`,
  `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`,
  `form-action 'self'`, `connect-src 'self'`, `upgrade-insecure-requests` in
  production. Development adds only `'unsafe-eval'` and `ws:` for Fast
  Refresh. `style-src` keeps `'unsafe-inline'` (Next injects style tags);
  this is the known trade-off.
- Static headers in `next.config.ts`: HSTS (2 years, includeSubDomains;
  preload once stable), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), geolocation=(), microphone=(self),
  payment=(), usb=()`, `X-DNS-Prefetch-Control: off`, `x-powered-by` removed.
- No third-party scripts, fonts, or origins; Geist is self-hosted.

### Auditability

- `atlas_event` (append-only) records today: `system.bootstrap.completed`,
  `profile.created`/`updated`, `auth.sign_up.denied`. Vocabulary for
  sign-in/out, passkeys, memory lifecycle, projects, and capabilities is
  defined in `src/modules/events/domain/event.ts` and wired as those flows land.
- Payloads are redacted (never prompts, content, or secrets). Retained
  indefinitely; owner-visible in a later "Activity" view.

### Logging

- `src/core/observability/logger.ts` emits JSON lines and redacts by key
  (password, secret, token, api key, authorization, cookie, prompt,
  instructions, content, parts, memory, embedding, email) at any depth.
  `console.*` is lint-banned outside the logger sink.

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
