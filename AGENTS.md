# Atlas OS — Agent Instructions

Atlas OS is a private Personal Intelligence Operating System. It is not a chatbot wrapper, SaaS dashboard, or demo.

Hierarchy: **Owner → Atlas → capabilities / future Operatives → results.**

Atlas is the product identity. Model providers are infrastructure.

## Current phase

Phase 1 is a narrow vertical slice. Read `docs/PHASE-1.md` before implementing anything.

Do not implement future worlds (Operatives workforce, Founder Command, Performance & Health, Creator Studio, Personal Command) unless a task explicitly expands scope.

## Product rules

- Prove one real loop: **talk → persist → remember → retrieve → advise from real context**.
- Never fake functionality. Empty states must be empty. Future capabilities are omitted or explicitly marked unavailable.
- Atlas is central. Prefer command → intelligence → context → action over navigation → page → form → dashboard.
- Conversation is a mode of the OS, not the entire product.
- Memory must be inspectable, editable, and deletable by the owner.
- Do not stream hidden chain-of-thought as product UI.

## Atlas voice

One intelligence, not a set of personas. Atlas is highly intelligent, calm, masculine, tactical, sophisticated, confident, candid, and solution-oriented. Concise by default; deeply analytical when the decision deserves it. Willing to challenge weak ideas. Proactive without nagging.

## Architecture rules

- Modular monolith. No microservices, no monorepo, no LangChain/LangGraph.
- Own the memory schema. Do not outsource memory to Mem0, Zep, Letta, or similar.
- Every domain row is scoped to `userId`. The DAL enforces isolation; UI checks are not security.
- Provider/model routing lives behind an Atlas registry. Do not call provider SDKs from UI code.
- Tools and future Operatives share one capability contract. Add tools only when they do real work.
- Secrets never ship to the client.
- Voice, jobs, graph memory, and integrations must have extension points, not fake UIs.

Authoritative documents:

- `docs/ARCHITECTURE.md`
- `docs/PHASE-1.md`
- `docs/DATA-MODEL.md`
- `docs/DESIGN.md`
- `docs/SECURITY.md`
- `docs/IMPLEMENTATION-SEQUENCE.md`

## Implementation rules

- TypeScript strict. No `any` unless a short comment explains why.
- Separate domain logic from presentation.
- Keep the app buildable after each milestone.
- Run lint, typecheck, and build after significant changes. Fix errors.
- Test meaningful domain logic (memory, retrieval, isolation, routing). Do not snapshot decorative UI.
- Do not install packages for speculative features.
- Do not add shadcn, generic admin kits, Three.js, or decorative WebGL.
- Do not invent metrics, memories, operatives, or business data.

## Design rules

Visual target: luxury Swiss watch × command center × performance laboratory. Obsidian, deep gold, deep purple. Restraint is the luxury. Motion communicates state, not decoration. Respect `prefers-reduced-motion`.

Layout is mode-driven (`compact`, `command`, `expanded`), not a pile of breakpoints. The Samsung Fold is a first-class device, but fold APIs need CSS fallbacks.
