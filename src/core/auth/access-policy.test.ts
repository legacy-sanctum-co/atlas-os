import { describe, expect, it } from "vitest";

import { decideSignUp, normalizeEmail } from "./access-policy";

describe("decideSignUp", () => {
  const allowlist = ["Owner@Example.com"];

  it("allows the first allowlisted owner", () => {
    expect(decideSignUp({ email: "owner@example.com", allowlist, existingUserCount: 0 })).toEqual({
      allowed: true,
    });
  });

  it("is case- and whitespace-insensitive", () => {
    expect(
      decideSignUp({ email: "  OWNER@example.COM ", allowlist, existingUserCount: 0 }).allowed,
    ).toBe(true);
  });

  it("denies non-allowlisted addresses", () => {
    expect(decideSignUp({ email: "someone@example.com", allowlist, existingUserCount: 0 })).toEqual(
      { allowed: false, reason: "not_allowlisted" },
    );
  });

  it("closes registration entirely once an owner exists", () => {
    expect(decideSignUp({ email: "owner@example.com", allowlist, existingUserCount: 1 })).toEqual({
      allowed: false,
      reason: "owner_exists",
    });
  });

  it("denies everyone when no allowlist is configured", () => {
    expect(
      decideSignUp({ email: "owner@example.com", allowlist: [], existingUserCount: 0 }),
    ).toEqual({ allowed: false, reason: "no_allowlist" });
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  A@B.Com ")).toBe("a@b.com");
  });
});
