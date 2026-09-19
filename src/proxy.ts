import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { buildContentSecurityPolicy } from "@/core/security/csp";

/**
 * Edge proxy (Next 16 `proxy.ts`).
 * 1. Per-request nonce-based CSP.
 * 2. Optimistic redirect: no session cookie → /sign-in. This is a UX
 *    shortcut only; real authorization happens in server code via
 *    `requireSession()` next to every data access.
 */

const PUBLIC_PATHS = new Set(["/sign-in"]);

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth");
  const hasSessionCookie = Boolean(getSessionCookie(request, { cookiePrefix: "atlas" }));

  if (!isPublic && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (pathname === "/sign-in" && hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const csp = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals; everything else gets CSP + auth check.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
