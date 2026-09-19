import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium select-none " +
  "transition-[background-color,box-shadow,transform,color] duration-fast ease-precise " +
  "disabled:pointer-events-none disabled:opacity-50 pressed:scale-[0.985]";

const variants: Record<Variant, string> = {
  primary:
    "bg-gold-3 text-obsidian-0 shadow-e1 hocus:bg-gold-2 pressed:bg-gold-4 " +
    "border border-gold-2/40",
  secondary: "material-raised text-ink-1 hocus:bg-obsidian-4 pressed:bg-obsidian-3 border-line-2",
  ghost: "text-ink-2 hocus:bg-obsidian-3 hocus:text-ink-1 pressed:bg-obsidian-4",
  danger:
    "bg-signal-critical/15 text-signal-critical border border-signal-critical/30 " +
    "hocus:bg-signal-critical/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
