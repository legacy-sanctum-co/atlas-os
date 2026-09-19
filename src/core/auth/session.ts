import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth, type Session } from "./server";

/**
 * Server-side session access. `getSession` is request-memoized so layouts,
 * pages, and actions in one request share a single DB lookup.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Use in every protected server component / action / route. Redirects to
 * sign-in when there is no session. Proximity of the check to the data
 * access is the real protection; proxy.ts is only an optimistic shortcut.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}
