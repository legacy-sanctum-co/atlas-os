# ADR 0008 — Environment modes for foldable-first responsive design

Status: Accepted · 2026-09-18

## Context

The Samsung Galaxy Fold is a first-class command device: closed it is a
narrow, tall phone screen (~340–380 CSS px wide); open it is a near-square
tablet (~700–840 px) with a hinge that may be exposed as two viewport
segments. Generic breakpoints produce accidental layouts on both.

Web platform status (Sept 2026): Viewport Segments API (CSS
`horizontal/vertical-viewport-segments`, `env(viewport-segment-*)`,
`window.viewport.segments`) ships in Chrome 138+ / Chrome Android 149+;
Device Posture API (`device-posture: folded | continuous`,
`navigator.devicePosture`) ships in Chrome 132+ and Samsung Internet 29+.
Neither is in Safari or Firefox.

## Decision

Model layout as three **named environment modes** rather than breakpoints:

| Mode | Intent |
| --- | --- |
| `compact` | Fast commands, conversation, essential intelligence (Fold closed, phones) |
| `portable` | Two-pane portable command center (Fold open, tablets) |
| `command` | Full operating environment (desktop) |

Implementation — **robust responsive foundation first, fold APIs as
progressive enhancement only**:

1. **Primary (always works):** CSS breakpoints define the mode.
   `compact < 640px`, `portable 640–1199px`, `command ≥ 1200px`, expressed as
   custom Tailwind variants (`compact:`, `portable:`, `command:`) and as
   `data-env` on the shell root. Container queries (`@container`) adapt panes
   and components to their own width so they are mode-agnostic where
   possible. Layout primitives (`Shell`, `Pane`, `Rail`, `Dock`) encapsulate
   placement; screens never hand-roll grid math.
2. **Client refinement:** `useEnvironmentMode()` in `src/design/environment`
   mirrors the same breakpoints via `matchMedia` for logic that must know the
   mode (e.g., which pane hosts a sheet). Server render and first paint use
   CSS only; there is no layout flash and no JS dependency for layout.
3. **Enhancement (guarded, optional):** where `device-posture` and
   `horizontal/vertical-viewport-segments` are supported, a
   `@media (horizontal-viewport-segments: 2)` block sizes the two `portable`
   panes with `env(viewport-segment-width …)` so nothing crosses the hinge,
   and the hook exposes `{ posture, segments }` for non-critical polish
   (e.g., docking the composer to the bottom segment). All fold behavior is
   additive; removing it leaves a correct layout.
4. Transitions between modes use `<ViewTransition>` with spatially coherent
   motion.
5. Playwright projects: `mobile-narrow` (360×800), `fold-cover` (376×880),
   `fold-open` (840×880), `laptop` (1366×768), `desktop-wide` (1920×1080).
   Physical Fold validation is an acceptance criterion but nothing critical
   depends on hinge detection.

## Consequences

- Every screen is designed three times, intentionally.
- The UI is correct in every browser; Chromium/Samsung Internet users get
  hinge-aware refinement.
- No component may import fold APIs directly; only
  `src/design/environment` touches them.

## Alternatives considered

- **Standard Tailwind breakpoints only**: ignores posture and hinge; Fold
  open would receive a stretched phone layout.
- **Native Android app**: out of scope; the web app must be excellent first.
