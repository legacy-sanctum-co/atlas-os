import { cn } from "../cn";

interface AtlasMarkProps {
  size?: number;
  className?: string;
  /** Show the violet "presence" glow — reserved for when Atlas is active. */
  active?: boolean;
}

/**
 * Atlas identity mark: a precise ring with a single gold index, like a
 * watch bezel. Pure SVG so it scales from the dock to a cinematic title.
 */
export function AtlasMark({ size = 28, className, active = false }: AtlasMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Atlas"
      className={cn(active && "drop-shadow-[0_0_10px_oklch(0.66_0.14_298/0.5)]", className)}
    >
      <circle cx="16" cy="16" r="14" stroke="var(--color-line-3)" strokeWidth="1" />
      <circle cx="16" cy="16" r="10.5" stroke="var(--color-gold-2)" strokeWidth="1.25" />
      <circle
        cx="16"
        cy="16"
        r="3"
        fill={active ? "var(--color-violet-2)" : "var(--color-ink-1)"}
      />
      <rect x="15.4" y="2" width="1.2" height="4" rx="0.6" fill="var(--color-gold-1)" />
    </svg>
  );
}
