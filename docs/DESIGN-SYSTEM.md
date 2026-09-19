# Atlas OS — Design System

Target: **luxury Swiss watch × futuristic command center × elite performance
laboratory × personal AI intelligence.** Restrained, dimensional, tactile,
masculine, intelligent. 2075 sophistication, not "futuristic" decoration.

## 1. Principles

1. **Depth over decoration.** Hierarchy comes from spatial layering, light,
   and typography, not from borders and rounded cards.
2. **Motion is information.** Every animation encodes state (Atlas
   listening, thinking, streaming, committing to memory) or spatial
   relationship (where a panel came from). Otherwise it does not exist.
3. **Atlas is present.** The composer and Atlas' state indicator are visible
   in every environment.
4. **Precision.** Tabular numerals, hairline rules, exact optical alignment,
   watch-dial-grade detail on small elements.
5. **Quiet color.** Obsidian dominates. Gold means authority and primary
   action. Purple means intelligence activity. Both are accents.
6. **Real or absent.** No decorative widgets for capabilities that do not
   exist.

## 2. Tokens (Tailwind 4 `@theme`, OKLCH)

Defined in `src/design/tokens/theme.css`. Indicative values; tune with real
rendering on the Fold and a calibrated desktop display.

```css
@theme {
  /* Obsidian base — true black with a cool undertone */
  --color-obsidian-950: oklch(0.09 0.004 280);
  --color-obsidian-900: oklch(0.12 0.005 280);
  --color-obsidian-800: oklch(0.16 0.006 280);
  --color-obsidian-700: oklch(0.21 0.007 280);
  --color-obsidian-600: oklch(0.28 0.008 280);

  /* Gold — deep, masculine, metallic, never yellow */
  --color-gold-300: oklch(0.86 0.10 85);
  --color-gold-400: oklch(0.78 0.12 82);
  --color-gold-500: oklch(0.70 0.13 78);   /* primary */
  --color-gold-600: oklch(0.58 0.12 74);
  --color-gold-700: oklch(0.46 0.10 70);

  /* Purple — deep, restrained; intelligence state */
  --color-violet-300: oklch(0.72 0.13 300);
  --color-violet-500: oklch(0.52 0.17 298);
  --color-violet-700: oklch(0.36 0.15 296);
  --color-violet-900: oklch(0.22 0.10 294);

  /* Text */
  --color-text-primary:   oklch(0.95 0.005 85);
  --color-text-secondary: oklch(0.72 0.008 85);
  --color-text-muted:     oklch(0.55 0.008 85);

  /* Semantic */
  --color-signal-positive: oklch(0.72 0.12 150);
  --color-signal-caution:  oklch(0.78 0.13 70);
  --color-signal-critical: oklch(0.62 0.18 25);

  /* Surfaces: elevation via lightness + translucency, not shadows alone */
  --surface-0: var(--color-obsidian-950);
  --surface-1: oklch(0.12 0.005 280 / 0.92);
  --surface-2: oklch(0.16 0.006 280 / 0.88);
  --surface-3: oklch(0.21 0.007 280 / 0.85);
  --surface-4: oklch(0.28 0.008 280 / 0.80);

  --radius-xs: 2px;  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px;

  --font-display: "Instrument Serif", ui-serif, serif;      /* or a geometric display sans; decide in Milestone 3 */
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.3, 0, 0, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --duration-fast: 120ms; --duration-base: 220ms; --duration-slow: 420ms;
}
```

Contrast: verify `gold-500` and `violet-300` text on `obsidian-950` meet
4.5:1; use `gold-300`/`violet-300` for text, `gold-500`/`violet-500` for
fills and strokes.

## 3. Materials

- **Obsidian glass**: `surface-n` + `backdrop-filter: blur(20px) saturate(1.2)`
  used sparingly for overlays and the composer. Never for entire pages.
- **Hairlines**: 1px rules at `oklch(1 0 0 / 0.08)`; gold hairlines
  (`gold-500 / 0.35`) only to mark the active or primary element.
- **Metallic edge**: a single-pixel gradient stroke (light top-left, dark
  bottom-right) on primary controls. This is the watch-case cue.
- **Lighting**: one soft radial highlight per surface at most, positioned
  consistently top-left. Light communicates depth; it does not glow.
- **Intelligence state**: a low-amplitude violet field behind the Atlas
  indicator whose intensity tracks state (idle → listening → thinking →
  streaming → committing). Implemented as CSS variables driven by state, not
  as a looping decorative animation.

## 4. Typography

- Display: headings, section titles, key numerals. Tight tracking.
- Sans: body, UI. Sizes on a 1.2 modular scale from 13px.
- Mono: ids, timestamps, data, tool inputs/outputs.
- `font-variant-numeric: tabular-nums` everywhere numbers align.
- Uppercase micro-labels (11px, +8% tracking, `text-muted`) for section
  headers, the way a dial labels its complications.

## 5. Motion

| State / event | Treatment |
| --- | --- |
| Environment transition (compact ↔ portable ↔ command) | React 19.3 `<ViewTransition>` on the shell; panes slide/scale along their spatial axis, 420ms emphasized |
| Atlas thinking | Indicator field breathes (opacity 0.5→0.8, 1.6s) — the only loop allowed, and only while thinking |
| Streaming text | No per-character animation; a 120ms fade-in per paragraph block |
| Tool call | Tool part expands from the indicator with a 220ms standard ease; status ticks in mono |
| Memory committed | Brief gold hairline pulse on the "What Atlas knows" panel header |
| Approval required | Composer border shifts to caution; approval card enters from the composer |
| Reduced motion | All of the above collapse to opacity changes ≤ 120ms |

Rules: `transform`/`opacity` only; no layout animation in lists longer than
~20 items; durations and easings from tokens; everything honors
`prefers-reduced-motion`.

## 6. Environment modes (responsive strategy)

Three intentionally designed modes rather than accidental breakpoints.

| Mode | Devices | Shell |
| --- | --- | --- |
| `compact` | Galaxy Fold closed (~ 340–380 CSS px wide, tall), phones | Single column. Atlas composer docked bottom. Top: current focus (venture/project) and Atlas state. Conversation is the primary view; history, memory, and ventures are sheets. |
| `portable` | Fold open (~ 700–840 px, near-square), tablets | Two panes. Left: conversation. Right: context rail (focus, memories used, projects). On a dual-segment viewport, panes map exactly to segments so nothing crosses the hinge. |
| `command` | Desktop ≥ 1200 px | Three regions: left navigation rail (collapsible), center Atlas, right context rail. Secondary environments (Ventures, Memory) open as focused views in center with Atlas docked. |

Detection (`src/design/environment/use-environment-mode.ts`):

1. `@media (device-posture: folded)` and `(horizontal-viewport-segments: 2)`
   / `(vertical-viewport-segments: 2)` when supported (Chromium; Samsung
   Internet 29+ for posture).
2. `window.viewport.segments` for exact pane sizing via
   `env(viewport-segment-width 0 0)` etc.
3. Container queries on the shell for pane-level adaptation.
4. Width fallback: `< 640 → compact`, `640–1199 → portable`, `≥ 1200 → command`.

Fold-specific constraints: never place a control or text across the hinge
gap; the composer sits in the segment where the keyboard rises (bottom
segment when `vertical-viewport-segments: 2`); respect `safe-area-inset-*`.
Test with Chrome DevTools dual-screen emulation and on the physical device.

## 7. Components (Phase 1 primitives)

`src/design/primitives`: `Surface`, `Hairline`, `Text`, `Button`
(primary gold / secondary / ghost), `IconButton`, `Field`, `TextArea`,
`Badge`, `MicroLabel`, `Sheet`, `Dialog`, `Menu`, `Tooltip`, `Skeleton`,
`AtlasIndicator`, `Composer`, `MessageThread`, `ToolPart`, `ApprovalCard`,
`ContextRail`, `Shell`.

Accessibility primitives (dialog, menu, tooltip, popover) are built on Base UI
or Radix primitives for focus management; styling is entirely ours.

## 8. Anti-patterns (reject in review)

Generic admin dashboards · grids of cards · default shadcn look · neon
cyberpunk · gamer aesthetics · glowing purple washes · cheap gradients · big
empty heroes · large rounded rectangles everywhere · stock SaaS layouts ·
complexity without purpose · fake data.
