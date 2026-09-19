# Research Record — September 2026

Findings that materially shaped the Atlas OS architecture. Versions verified
against the npm registry on 2026-09-18. Re-verify before upgrading majors.

## Verified versions

| Package | Latest | Adopted | Note |
| --- | --- | --- | --- |
| `next` | 16.3.5 | 16.3.x | Turbopack default; `proxy.ts` replaces middleware; Cache Components opt-in; Node runtime for proxy |
| `react` / `react-dom` | 19.3.0 | 19.3.x | `<ViewTransition>` and Fragment refs stable |
| `typescript` | 7.0.2 | **6.0.3** | 7.x is the Go compiler: no JS compiler API; `next build` needs `experimental.useTypeScriptCli`; `typescript-eslint` peer `<6.1` |
| `ai` | 7.0.107 | 7.x | Node 22+, ESM only; `instructions`, `isStepCount`, `onEnd`, `toolApproval`, `timeout`, `telemetry`, `runtimeContext`, `toolsContext` |
| `@ai-sdk/react` | 4.0.110 | 4.x | `useChat` + `DefaultChatTransport`, `parts` rendering, `addToolApprovalResponse` |
| `drizzle-orm` | 0.45.2 (1.0.0-rc.5 on `rc`) | **0.45.2** | 1.0 removes RQB v1; use core query builder to ease migration |
| `drizzle-kit` | 0.31.10 | 0.31.x | Does not emit `CREATE EXTENSION`; hand-write first migration |
| `better-auth` | 1.7.5 | 1.7.x | Drizzle adapter, passkey plugin, Next 16 proxy guidance |
| `zod` | 4.6.5 | 4.x | AI SDK peer `^4.1.8`; root import is v4 |
| `tailwindcss` | 4.3.3 | 4.x | CSS-first `@theme`, OKLCH, container queries built in |
| `motion` | 13.4.0 | 13.x | `motion/react`; only breaking change is Emotion prop filtering |
| `vitest` | 5.0.1 | 5.x | Node ≥ 22.12, Vite ≥ 6.4; async RSC still unsupported → Playwright |
| `@playwright/test` | 1.63.0 | 1.63.x | Next peer `^1.51.1` |
| `postgres` (postgres.js) | 3.4.9 | 3.x | Lightweight driver, Drizzle-supported |
| `inngest` / `workflow` | 4.20 / 4.8.9 | not installed | Evaluated for Phase 2 jobs |
| `@langfuse/vercel-ai-sdk` | 5.11.1 | optional | Targets AI SDK 7, Node 22 |

## Conclusions that changed the plan

1. **AI SDK 7 is the right abstraction layer.** Provider-neutral models,
   first-class tool approvals, typed tool context, timeouts, callback-based
   telemetry, and a `ToolLoopAgent`/`WorkflowAgent` path for future Operatives.
   It removes the need for LangChain-style frameworks. Model ids as strings
   also make Vercel AI Gateway a config switch, not a rewrite.
2. **Memory should be built, not bought, but follow the proven patterns.**
   Mem0's 2026 algorithm (single-pass ADD-only extraction, hybrid semantic +
   BM25 + entity retrieval) and Letta's tiered core/recall/archival model are
   both implementable on Postgres + pgvector + tsvector at personal scale.
   Hosting memory in a third-party service is a privacy regression for this
   product. Owner review of extracted candidates is added because "no fake
   memories" means no silently inferred ones either.
3. **TypeScript 7 is not ready for this stack.** Adopting it would require an
   experimental Next flag and break `typescript-eslint`. Pin 6.0 and revisit.
4. **Drizzle 1.0 is close but not GA.** Adopt 0.45 stable; avoid RQB v1
   (`db.query.*` relations) so the 1.0 upgrade is mechanical.
5. **Better Auth over Auth.js and Clerk.** Self-hosted, data in our
   database, passkeys as a plugin, typed schema, explicit Next 16 guidance.
   Clerk would put the owner's identity in a vendor; Auth.js needs custom
   work for passkeys and is in maintenance mode relative to Better Auth.
6. **Foldable web APIs are real but Chromium-only.** Viewport Segments
   (Chrome 138+, Chrome Android 149+) and Device Posture (Chrome 132+, Samsung
   Internet 29+) can be used with progressive enhancement; width-based
   fallback is mandatory. The Galaxy Fold closed screen is a narrow, tall
   viewport (~340–380 CSS px) that must be designed for explicitly.
7. **Voice has a clear, secure path** (OpenAI Realtime over WebRTC with
   server-minted ephemeral secrets from `/v1/realtime/client_secrets`, SDP to
   `/v1/realtime/calls`). Older `/realtime/sessions` tutorials are obsolete.
   Deferred to Phase 2 but shapes the composer abstraction now.
8. **Background jobs do not justify a platform yet.** Next `after()` covers
   post-turn extraction. Inngest fits the event-driven `atlas_event` model
   when the brief and integrations arrive; Vercel Workflow DevKit is a
   viable Vercel-native alternative. Keep a port.
9. **Observability is OTel-first.** AI SDK 7 emits GenAI-semantic spans via
   `@ai-sdk/otel`; Langfuse (MIT, self-hostable) consumes them. No vendor
   lock-in.
10. **Field-level encryption pattern**: AES-256-GCM, per-value nonce, AAD
    bound to row identity, versioned keys, HMAC blind index for equality.
    Ship the helper before any sensitive data exists.
11. **Testing split is forced by tooling**: Vitest cannot render async
    server components; flows go to Playwright against `next build && next
    start`.
12. **Neon over Supabase** for this product: we do not want Supabase Auth/RLS
    (Better Auth owns identity), and Neon's copy-on-write branching and
    scale-to-zero suit a single-owner app with preview deployments.

## Sources consulted (primary where possible)

Next.js 16 release notes and TypeScript config docs · AI SDK 7 changelog and
docs (tool calling, chatbot tool usage, message persistence, resume streams,
Langfuse observability, AI Gateway provider) · Better Auth docs (Next.js
integration, Drizzle adapter, passkey plugin) · Drizzle docs (pgvector guide,
v0→v1 changes, relations v2) · Tailwind v4 theme docs · Motion upgrade guides
and changelog · React 19.3 release post · Vitest 5 release and migration
guide · Next.js Vitest guide · Chrome Developers "Viewport Segments API
shipped" · MDN Viewport Segments and Device Posture · W3C Device Posture CR
draft · caniuse tables · OpenAI Realtime WebRTC guide and Agents SDK voice
quickstart · Vercel Workflow docs and Inngest comparison · Mem0 paper
(arXiv 2504.19413) and 2026 README · Langfuse docs · TypeScript 7.0
announcement · Neon and Supabase pricing pages.
