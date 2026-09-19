import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("is strict in production", () => {
    const csp = buildContentSecurityPolicy({ nonce: "abc", isDevelopment: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("ws:");
  });

  it("relaxes only what dev tooling needs", () => {
    const csp = buildContentSecurityPolicy({ nonce: "abc", isDevelopment: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws: wss:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("allows explicit extra connect sources only", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "n",
      isDevelopment: false,
      connectSources: ["https://otel.example.internal"],
    });
    expect(csp).toContain("connect-src 'self' https://otel.example.internal");
  });
});
