# Implementation Sequence

Execute in order. Each step should leave the app buildable. Do not start a later step by faking the earlier one.

This sequence assumes the architecture in `docs/` has been accepted, including the recommended defaults in `docs/CHATGPT-REVIEW.md`.

## Step 0 — Confirm or record defaults

If the owner has not objected, proceed with:

- Better Auth + email allowlist
- Neon Postgres + Drizzle + pgvector
- AI SDK 7 with Anthropic default conversation model and OpenAI embeddings
- Vercel-portable hosting, no Gateway lock-in
- No voice, no Operatives UI, no health, no shadcn

If a default is rejected, update `docs/` in the same change before coding.

## Step 1 — Bootstrap the application

1. `pnpm create next-app@latest .` (or a subdir only if the empty-root tool requires it) with App Router, TypeScript, Tailwind, ESLint, `src/`.
2. Use Next.js 16 and React 19 as created. Set Node 22 in `package.json` engines.
3. Enable TypeScript strict.
4. Add Vitest + a `typecheck` script (`tsc --noEmit`).
5. Add `.env.example` with the secret names from `docs/SECURITY.md`.
6. Keep `AGENTS.md`, `docs/`, and `.cursor/rules/`.
7. Commit a running empty Next app that still does not claim to be Atlas functionally.

## Step 2 — Design tokens and dead-honest shell

1. Replace the default homepage.
2. Implement tokens from `docs/DESIGN.md`.
3. Build `AppShell`, layout-mode hook (width-based first), `AtlasPresence` idle state, and `CommandInput` with no network.
4. Gate route can exist as a static layout; do not fake a signed-in OS.
5. Verify compact / command / expanded visually. No placeholder metrics.

## Step 3 — Database

1. Add Drizzle, `pg` or Neon driver, `drizzle-kit`.
2. Enable `vector` in an initial SQL migration.
3. Implement schemas from `docs/DATA-MODEL.md` (app tables).
4. Leave Better Auth tables to Step 4 generation, then merge.
5. Add a scoped DAL skeleton: `requireOwner()`, `withOwner(userId)`.

## Step 4 — Auth

1. Install Better Auth and the current Drizzle adapter package (verify import path at install time; docs currently mention both `better-auth/adapters/drizzle` and `@better-auth/drizzle-adapter`).
2. Generate auth schema and migrate.
3. Mount `/api/auth/[...all]`.
4. Implement allowlist in the sign-up / sign-in path.
5. Custom Gate UI — not Clerk-like stock widgets if they clash with the shell.
6. `proxy.ts` cookie gate for `/`, `/context`, `/settings`, `/first-run`, `/intelligence`.
7. `requireOwner()` on all protected servers.
8. Tests: unknown email rejected; session required for DAL.

## Step 5 — Context writes without AI

1. Profile read/write.
2. Entity list/create/update/archive.
3. Memory list/edit/invalidate (manual create allowed for tests).
4. Context screens with honest empty states.
5. Audit writes on mutations.

The OS is now a private notebook. That is acceptable. Do not hide these screens behind fake intelligence.

## Step 6 — Atlas runtime (non-stream first if useful, then stream)

1. Constitution module (server-only).
2. Provider registry + model router.
3. Context assembler using DAL.
4. `/api/atlas/turn` with `streamText` and UI message stream.
5. Persist user and assistant messages.
6. Client `useChat` (or equivalent AI SDK 7 hook) wired to Command / Intelligence.
7. Rate limit + Zod body validation.
8. If no provider key is configured, show an explicit unavailable state. Do not mock replies.

## Step 7 — Capabilities

1. Registry with `memory.write`, `memory.invalidate`, `entity.upsert`, `profile.update`.
2. Bind tools into `streamText`.
3. Surface tool results as concise Atlas actions.
4. Tests for permission + owner scoping.

## Step 8 — Memory extraction

1. `after()` on turn completion.
2. Extraction model via router (`memory_extract`).
3. ADD / UPDATE / INVALIDATE against similar valid memories.
4. Embed when `OPENAI_API_KEY` (or chosen embedding key) exists.
5. Assembler retrieves valid memories on the next turn.
6. Tests: contradiction invalidates; invalid memories are not assembled.

## Step 9 — First-run

1. Detect `profiles.onboarding_status`.
2. Four-step progressive flow inside the Atlas shell.
3. Writes profile + entities.
4. Skippable to Command.
5. No giant questionnaire.

## Step 10 — Command brief

1. Server-compose a brief from profile, active entities, valid decisions/commitments, and open threads.
2. If Atlas has almost no context, say that and ask one sharp question.
3. Never invent counts of "systems online."

## Step 11 — Settings and model preference

1. Show account email.
2. Allowlisted model switcher that only changes router defaults for `conversation`.
3. Sign out.
4. Do not add fake export or API-key entry fields in the client.

## Step 12 — Hardening

1. Security headers.
2. CSP as tight as Next + AI stream allow.
3. Production log policy (no bodies).
4. Fold/posture feature-detect hook (no-op fallback).
5. PWA manifest only if it does not require fake icons/marketing copy. Otherwise wait.

## Step 13 — Quality gate

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
2. Manual journey: sign-in → first-run → speak → memory appears → new thread recalls → invalidate → no longer recalled
3. Verify compact and expanded layouts
4. Confirm no Operatives/health/finance surfaces
5. Confirm no secrets in client bundle (`pnpm build` + grep for key prefixes if needed)

## Step 14 — Deploy

1. Neon database + `vector`
2. Vercel project, same region
3. Host env vars
4. Allowlist the owner's email
5. Smoke the production journey once

Do not deploy a public marketing domain that implies open registration.

## After Phase 1 (do not pull forward)

- Voice transport into the same turn pipeline
- Inngest for scheduled Command briefs
- First real integration (calendar or GitHub, not five)
- `entity_links` when relations are real
- Operative capability kind with one real specialist
- Passkeys / 2FA
- Health data class
- Self-host option
