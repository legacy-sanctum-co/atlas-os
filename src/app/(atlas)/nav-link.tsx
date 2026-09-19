"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/design/cn";
import { AtlasMark } from "@/design/primitives/atlas-mark";

type Glyph = "atlas" | "home" | "shield";

interface NavLinkProps {
  href: "/" | "/security";
  label: string;
  glyph: Glyph;
}

export function NavLink({ href, label, glyph }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href;

  if (glyph === "atlas") {
    return (
      <Link href={href} aria-label={label} className="rounded-md p-1">
        <AtlasMark size={30} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex size-11 flex-col items-center justify-center gap-0.5 rounded-md text-ink-3",
        "transition-[background-color,color] duration-fast ease-precise",
        "hocus:bg-obsidian-3 hocus:text-ink-1",
        active && "bg-obsidian-3 text-gold-2",
      )}
    >
      <GlyphIcon glyph={glyph} />
      <span className="text-2xs portable:hidden command:hidden">{label}</span>
    </Link>
  );
}

function GlyphIcon({ glyph }: { glyph: Glyph }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (glyph) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 3 8.2 7 9.5 4-1.3 7-5 7-9.5V6z" />
          <path d="m9.5 12 1.8 1.8L15 10" />
        </svg>
      );
    default:
      return null;
  }
}
