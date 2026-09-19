import type { ReactNode } from "react";

import { requireSession } from "@/core/auth/session";
import { Dock, Rail, Shell } from "@/design/primitives/shell";

import { EnvironmentBadge } from "./environment-badge";
import { NavLink } from "./nav-link";
import { SignOutButton } from "./sign-out-button";

/**
 * Authenticated environment. The session check here protects every page in
 * the group; individual pages and actions still call requireSession() next
 * to their own data access.
 */
export default async function AtlasLayout({ children }: { children: ReactNode }) {
  await requireSession();

  const nav = (
    <>
      <NavLink href="/" label="Home" glyph="home" />
      <NavLink href="/security" label="Security" glyph="shield" />
    </>
  );

  return (
    <Shell
      rail={
        <Rail>
          <NavLink href="/" label="Atlas" glyph="atlas" />
          <div className="mt-2 flex flex-col gap-1">{nav}</div>
          <div className="mt-auto flex w-full flex-col items-center gap-2 px-1">
            <EnvironmentBadge />
            <SignOutButton />
          </div>
        </Rail>
      }
      dock={
        <Dock>
          {nav}
          <SignOutButton compact />
        </Dock>
      }
    >
      {children}
    </Shell>
  );
}
