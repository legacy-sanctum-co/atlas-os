/**
 * Environment modes (ADR 0008). Pure; shared by CSS-equivalent logic in the
 * client hook and by tests. Breakpoints must match tokens.css.
 */

export const ENVIRONMENT_MODES = ["compact", "portable", "command"] as const;
export type EnvironmentMode = (typeof ENVIRONMENT_MODES)[number];

export const BREAKPOINT_PORTABLE_PX = 640;
export const BREAKPOINT_COMMAND_PX = 1200;

export function modeForWidth(widthPx: number): EnvironmentMode {
  if (widthPx < BREAKPOINT_PORTABLE_PX) return "compact";
  if (widthPx < BREAKPOINT_COMMAND_PX) return "portable";
  return "command";
}

export type DevicePosture = "continuous" | "folded";

export interface ViewportSegments {
  horizontal: number;
  vertical: number;
}

export interface EnvironmentState {
  mode: EnvironmentMode;
  /** Present only when the browser exposes the Device Posture API. */
  posture: DevicePosture | null;
  /** Present only when the browser exposes viewport segments. */
  segments: ViewportSegments | null;
}

export const MEDIA_QUERIES = {
  portable: `(min-width: ${BREAKPOINT_PORTABLE_PX}px)`,
  command: `(min-width: ${BREAKPOINT_COMMAND_PX}px)`,
  folded: "(device-posture: folded)",
  twoHorizontalSegments: "(horizontal-viewport-segments: 2)",
  twoVerticalSegments: "(vertical-viewport-segments: 2)",
} as const;
