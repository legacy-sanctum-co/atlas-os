# ADR 0005 — Better Auth with closed registration and passkeys

Status: Accepted · 2026-09-18

## Context

Atlas OS is a private system for one owner (possibly a few trusted people
later). Identity data must stay in our database. Sign-in must be fast on a
phone (Galaxy Fold) and strong against credential theft.

## Decision

- **Better Auth 1.7** with the Drizzle adapter and database sessions.
- **Closed registration**: sign-up allowed only for emails in
  `ALLOWED_OWNER_EMAILS` (validated in a `before` hook). Others receive a
  generic failure.
- **Methods**: email + password for bootstrap; **passkeys**
  (`@better-auth/passkey`) prompted on first sign-in and preferred
  thereafter. Passkey-only mode can be enabled once two authenticators are
  enrolled.
- **Session enforcement**: `requireSession()` (wrapping
  `auth.api.getSession({ headers })`) in every page, route handler, and
  server action. `proxy.ts` uses `getSessionCookie()` for an optimistic
  redirect only.
- **Cookies**: `HttpOnly`, `Secure`, `SameSite=Lax`; signed cookie cache;
  7-day expiry with sliding refresh.
- Auth events (`auth.signed_in`, `auth.passkey_added`, …) emit
  `atlas_event` rows.

## Consequences

- Users live in our Postgres; no per-MAU vendor cost or lock-in.
- We own the sign-in UI (designed within the Atlas design system).
- Adding OAuth providers, 2FA (TOTP), or organizations later is a plugin,
  not a migration.

## Alternatives considered

- **Clerk**: fastest, polished UI, but identity in a vendor and per-user
  pricing; wrong ownership model for a private OS.
- **Auth.js v5**: mature OAuth, but passkeys and richer features require
  custom work; its maintainers now recommend Better Auth for new projects.
- **Hand-rolled auth**: unjustified risk.
