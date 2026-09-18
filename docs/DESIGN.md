# Visual and Interaction Architecture

Atlas should feel like entering a private intelligence environment. The aesthetic target is luxury Swiss watch × futuristic command center × elite performance laboratory.

The failure mode is "neon cyberpunk dashboard." Restraint is the actual sophistication.

## Brand material

- **Obsidian** — true black with barely-split surfaces. Not charcoal gray cards on a gray app.
- **Gold** — deep, masculine, metallic. Aged, not highlighter yellow.
- **Purple** — deep, rare, used like a jewel, not a fill.

Suggested token direction (refine in implementation, do not cargo-cult hex from a template):

```css
--atlas-void: #050507;
--atlas-obsidian: #0B0B0F;
--atlas-raised: #12121A;
--atlas-gold: #C4A36A;
--atlas-gold-dim: #8A7344;
--atlas-purple: #3A2458;
--atlas-purple-deep: #241536;
--atlas-ink: #E8E2D6;
--atlas-mute: #8A8494;
```

Gold is for focus, authority, and Atlas presence. Purple is atmospheric and scarce. If the UI is glowing purple, it is wrong.

## Typography

Two voices, not a font party:

- **Display** — editorial serif for rare marks (ATLAS, environment titles). Think instrument-dial lettering, not a landing-page hero.
- **Interface** — precise grotesque for reading and command.
- **Mono** — timestamps, model refs, ids, memory metadata.

Do not use Inter as the personality. Geist / IBM Plex / similar technical families are closer. Keep display use sparse or it becomes a perfume ad.

## Spatial language

Depth comes from layered planes, hairline metallic edges, and light that feels like it has a source. Not drop shadows on rounded rectangles.

- Few radii. Tight, architectural corners. Occasional circular instrument marks.
- Glass only when it clarifies a layer. If everything is glass, nothing is.
- Information density should increase with viewport mode, not stay a giant empty hero.

Avoid: 12-column card grids, stat tiles with fake deltas, sidebar + table chrome, gradient orbs, scanline overlays, HUD clipart.

## Motion

Motion is system state:

- Atlas listening / thinking / speaking / idle
- environment transitions (Command ↔ Intelligence ↔ Context)
- stream arrival
- fold posture change

Use:

- CSS transforms and opacity
- React 19.3 View Transitions for environment changes
- `prefers-reduced-motion: reduce` as a first-class path

Do not use:

- Three.js / WebGL atmospheres
- looping neon pulses
- page-wide particle fields
- springy consumer-app bounciness

Target 60fps on a Fold. If an animation is only decorative, delete it.

## Interaction model

Primary loop:

**command → intelligence → context → action**

The owner should be able to speak to Atlas from every environment. Structured views (projects, memory) exist so the owner can see and correct what Atlas believes.

Command input is always available in compact mode. In expanded mode it can sit in a dedicated intelligence column beside context.

Do not make the product a form wizard with a chat drawer.

## Layout modes

```ts
type LayoutMode = "compact" | "command" | "expanded";
```

| Mode | Typical device | Experience |
| --- | --- | --- |
| `compact` | Fold closed, phone | Fast command, brief, conversation. No multi-pane. |
| `command` | Fold open, tablet, small laptop | Portable command center. Atlas + one context pane. |
| `expanded` | Desktop | Full OS: presence, thread, context, inspector. |

Resolution:

1. Container / width baseline (reliable everywhere)
2. `device-posture` and `horizontal-viewport-segments` / `vertical-viewport-segments` when supported
3. `env(viewport-segment-*)` so chrome does not sit in a hinge

Do not encode a single Samsung Fold pixel width as the design system. Treat Fold closed/open as the canonical examples of compact/command.

## Presence

Atlas has a persistent presence treatment — a restrained instrument, not an avatar cartoon and not a chat bubble.

States: `idle`, `listening`, `thinking`, `speaking`, `attention`.

Presence may use a slow material shift or a gold edge state. It must remain meaningful when motion is disabled (label + still state).

## Honesty

Empty Command is a quiet room with Atlas, not a skeleton of future modules.

Disabled future worlds are omitted. A single line in Settings may say that Operatives and Health are not built. That is documentation, not a product surface.
