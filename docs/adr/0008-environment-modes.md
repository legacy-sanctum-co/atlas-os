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

Implementation:

- `useEnvironmentMode()` in `src/design/environment` returns
  `{ mode, segments, posture }`, resolved from (1) posture and segment media
  queries / `window.viewport.segments` where available, (2) container size
  of the shell, (3) width fallback (`<640 compact`, `640–1199 portable`,
  `≥1200 command`). Server render uses the width fallback via CSS; the hook
  refines on the client without layout flash.
- The `Shell` component owns pane placement per mode. In dual-segment
  layouts panes are sized with `env(viewport-segment-width …)` so no element
  crosses the hinge. The composer lives in the bottom segment when segments
  stack vertically.
- Transitions between modes use `<ViewTransition>` with spatially coherent
  motion (panes slide toward where they came from).
- Playwright projects emulate: `fold-closed` (360×880, Android UA),
  `fold-open` (840×880), `desktop` (1440×900). Physical-device validation is
  an acceptance criterion.

## Consequences

- Every screen is designed three times, intentionally.
- Progressive enhancement: full behavior on Chromium/Samsung Internet,
  sensible fallback elsewhere.
- Container queries (Tailwind 4 built-in) keep components mode-agnostic
  where possible.

## Alternatives considered

- **Standard Tailwind breakpoints only**: ignores posture and hinge; Fold
  open would receive a stretched phone layout.
- **Native Android app**: out of scope; the web app must be excellent first.
