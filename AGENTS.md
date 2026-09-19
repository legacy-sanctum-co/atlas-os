# Atlas OS — Agent Instructions

Atlas OS is a private Personal Intelligence Operating System. One persistent
intelligence layer ("Atlas") sits between the owner and everything else:

```
OWNER → ATLAS → operatives / tools / systems / automations → results
```

Atlas is the product identity. Model providers are infrastructure. Never
conflate the two.

Read these before making changes:

- `docs/ARCHITECTURE.md` — system architecture and module boundaries
- `docs/PHASE-1.md` — current scope, sequence, acceptance criteria
- `docs/DATA-MODEL.md` — entities and relationships
- `docs/DESIGN-SYSTEM.md` — visual language, tokens, motion, responsive modes
- `docs/SECURITY.md` — security baseline
- `docs/adr/` — architectural decisions (add one when you make a new decision)
- `.cursor/rules/` — focused rules that Cursor applies automatically

## Non-negotiables

1. **Never fake functionality.** No placeholder memories, metrics, operatives,
   or data. If a capability is not real, omit it or label it `Future` in the UI.
2. **Atlas is central.** Interaction model is `command → intelligence →
   context → action`, not `navigation → page → form → dashboard`.
3. **Separate concerns.** Domain logic lives in `src/modules/*/domain` and
   `src/modules/*/server`; UI lives in `src/modules/*/ui` and `src/design`.
   Infrastructure (db, ai, auth, jobs, observability) lives in `src/core`.
4. **Provider-independent AI.** All model access goes through `src/core/ai`
   (`ModelRouter` roles like `atlas.primary`, `atlas.fast`, `atlas.embed`).
   Never import a provider SDK, or name a vendor/model/embedding dimension,
   outside `src/core/ai`. Providers are configuration, not architecture.
5. **Capabilities, not hardcoded tools.** Every tool Atlas can call is
   registered through the capability registry in `src/modules/intelligence`.
   The same registry will host Operatives later.
6. **Security first.** Validate the session in every server entry point
   (page, route handler, server action). `proxy.ts` only redirects. Secrets
   never reach the client. Sensitive fields are encrypted at the application
   layer.
7. **Strict TypeScript.** No `any` without a justifying comment. Zod at every
   boundary (env, request bodies, tool inputs, LLM structured output).
8. **Buildable at every commit.** Run `pnpm typecheck && pnpm lint && pnpm test`
   before committing. Fix warnings; do not accumulate them.
9. **Single owner, clean boundaries.** Phase 1 is a single-owner private
   system. Keep `user_id` on every owned table; build no teams, invitations,
   roles, organizations, or sharing.
10. **No speculative infrastructure.** Deferred systems (brief, Operatives,
    voice, integrations, gateway, Redis, durable jobs, WebGL) get a seam only
    where it is free (a column, a port, a registry), never code paths or
    dependencies.
11. **Responsive foundation first.** Breakpoints, container queries, and
    layout primitives make every layout correct everywhere; fold/hinge APIs
    are guarded progressive enhancement inside `src/design/environment`.

## Stack (pinned; see `docs/adr/0001-stack.md`)

Next.js 16 App Router · React 19.3 · TypeScript 6.0 (not 7 yet) · Tailwind 4 ·
Motion 13 · AI SDK 7 · Drizzle 0.45 (stable) · Postgres + pgvector (Neon) ·
Better Auth 1.7 · Zod 4 · Vitest 5 · Playwright · pnpm.

## Working style

- Work incrementally; one logical change per commit.
- Prefer editing existing files over creating new ones.
- Add an ADR in `docs/adr/` for any decision that changes architecture,
  a dependency, or a data model.
- Keep components small. If a component exceeds ~150 lines or mixes data
  fetching with presentation, split it.
- Test domain logic (memory ranking, context assembly, tool schemas,
  encryption, model routing) with Vitest. Test flows (auth, chat streaming,
  responsive modes) with Playwright.
- Do not install a package without a reason you could defend in an ADR.
