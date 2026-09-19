"use client";

import { useEnvironment } from "@/design/environment/use-environment";

/**
 * Shows the resolved environment mode. Useful during M1 verification and
 * as an honest readout of what the layout system detected.
 */
export function EnvironmentBadge() {
  const { mode, posture, segments } = useEnvironment();
  const detail = [posture, segments ? `${segments.horizontal}×${segments.vertical}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      className="text-data max-w-[calc(100%-0.75rem)] truncate rounded-sm border border-line-1 px-1 py-0.5 text-2xs leading-none text-ink-4"
      title={detail ? `Fold: ${detail}` : "No fold data exposed by this browser"}
      data-testid="environment-mode"
    >
      {mode}
    </span>
  );
}
