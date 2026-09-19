# ADR 0001 — Technology stack and version pins

Status: Accepted · 2026-09-18

## Context

Atlas OS is a long-lived, single-owner, privacy-sensitive application that
must support streaming AI, persistent memory, tool execution, a premium
responsive UI, and later voice and an AI workforce. The repository is empty.
We want a modular monolith that one engineer plus Cursor can evolve for years.

## Decision

| Concern | Choice | Why it fits Atlas OS |
| --- | --- | --- |
| Framework | Next.js 16.3 App Router, Node runtime | Server components for secure data access, route handlers for SSE streaming, `after()` for post-response work, first-class React 19.3, Vercel deployment with a container escape hatch |
| Language | TypeScript 6.0.x, strict | 7.x lacks the JS compiler API needed by `next build` (without experimental flag) and `typescript-eslint`; revisit when both support it |
| Package manager | pnpm | Strict, fast, lockfile discipline |
| Styling | Tailwind 4 with `@theme` tokens | Design tokens as CSS variables; OKLCH; container queries; no runtime CSS-in-JS |
| Motion | `motion` 13 + React `<ViewTransition>` | Component motion with tokens; native view transitions for environment changes |
| A11y primitives | Base UI (or Radix) primitives, unstyled | Focus management and ARIA correctness without importing a visual system |
| AI | AI SDK 7 (`ai`, `@ai-sdk/react`) | Provider-neutral; streaming UI messages; tool approvals; telemetry; agent path for Operatives |
| Providers | `@ai-sdk/anthropic`, `@ai-sdk/openai` direct | Deterministic behavior, provider options, no extra hop; AI Gateway remains a config switch |
| Database | Postgres 17 + pgvector on Neon | Relational + vector + full-text in one store; branching; scale-to-zero |
| ORM | Drizzle 0.45 stable + drizzle-kit | SQL-transparent, typed, native `vector()` column; migrations committed |
| Auth | Better Auth 1.7 + Drizzle adapter + passkeys | Self-hosted identity, DB sessions, typed schema, Next 16 support |
| Validation | Zod 4 | Boundaries, tool schemas, structured LLM output, env |
| Env | `@t3-oss/env-nextjs` | Fail fast on misconfiguration; server/client split |
| Tests | Vitest 5 + Testing Library; Playwright | Unit for domain; E2E for async RSC and flows |
| Lint/format | ESLint 10 flat config, typescript-eslint, jsx-a11y, Prettier | Standard, strict |
| Observability | OpenTelemetry via `@vercel/otel` + `@ai-sdk/otel`; Langfuse optional | Vendor-neutral traces; self-hostable AI tracing |
| Jobs | `after()` behind `JobRunner` port | See ADR 0007 |
| Deploy | Vercel + Neon; `output: 'standalone'` maintained | Fast path now, portability later |

## Consequences

- One `package.json`, no monorepo tooling until a second deployable exists.
- All AI provider imports are confined to `src/core/ai`.
- Upgrading TypeScript or Drizzle majors requires an ADR update.
- ESM everywhere (`"type": "module"`), Node 22 minimum (AI SDK 7, Vitest 5).

## Alternatives considered

- **Remix/React Router, TanStack Start**: viable, but Next has the deepest
  AI SDK, Vercel, and streaming integration; RSC data access model suits the
  security posture.
- **Prisma**: pgvector is `Unsupported` without raw SQL; Drizzle is native.
- **Clerk / Auth.js**: vendor-held identity vs. maintenance-mode library;
  Better Auth is the current self-hosted default.
- **Supabase**: bundles Auth/RLS we do not want to double up with Better
  Auth; Neon's branching is better for previews.
- **Mem0 / Letta hosted memory**: privacy regression; patterns adopted instead.
- **LangChain/LangGraph**: unnecessary layer over AI SDK 7's agent primitives.
- **Turborepo monorepo**: premature; single app is faster to evolve.
