import type { ReactNode } from "react";

import { cn } from "../cn";

interface ShellProps {
  /** Left rail in portable/command. Hidden in compact (use `dock`). */
  rail?: ReactNode;
  /** Primary environment pane. */
  children: ReactNode;
  /** Optional secondary pane in portable/command. */
  side?: ReactNode;
  /** Bottom dock in compact. */
  dock?: ReactNode;
  className?: string;
}

/**
 * Root layout primitive. Placement is decided entirely by
 * environment.css (breakpoints + guarded fold enhancements); this component
 * only declares slots. Server-rendered; no JS needed for layout.
 */
export function Shell({ rail, children, side, dock, className }: ShellProps) {
  return (
    <div
      className={cn("atlas-shell material-base", className)}
      data-has-side={side ? "true" : "false"}
    >
      {rail ? (
        <aside data-slot="rail" aria-label="Environment rail">
          {rail}
        </aside>
      ) : null}
      <main data-slot="main" id="main">
        {children}
      </main>
      {side ? (
        <aside data-slot="side" aria-label="Context">
          {side}
        </aside>
      ) : null}
      {dock ? (
        <nav data-slot="dock" aria-label="Command dock">
          {dock}
        </nav>
      ) : null}
    </div>
  );
}

interface PaneProps {
  children: ReactNode;
  className?: string;
  /** Constrain content to the reading measure and center it. */
  reading?: boolean;
}

/** Content region inside a shell slot. Container-query context for children. */
export function Pane({ children, className, reading = false }: PaneProps) {
  return (
    <div
      className={cn(
        "@container flex min-h-full flex-col px-4 py-5 portable:px-8 portable:py-8 command:px-12",
        reading && "mx-auto w-full max-w-reading",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface RailProps {
  children: ReactNode;
  className?: string;
}

/** Vertical rail for portable/command. Contains the Atlas mark and navigation. */
export function Rail({ children, className }: RailProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center gap-3 border-r border-line-1 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DockProps {
  children: ReactNode;
  className?: string;
}

/** Bottom dock for compact. Sits above the safe area. */
export function Dock({ children, className }: DockProps) {
  return (
    <div
      className={cn(
        "material-glass flex h-full items-center justify-around border-t border-line-1 px-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
