/**
 * Pure access policy for a single-owner private system (ADR 0005).
 * Kept free of framework imports so it is trivially unit-tested.
 */

export type SignUpDecision =
  | { allowed: true }
  | { allowed: false; reason: "owner_exists" | "not_allowlisted" | "no_allowlist" };

export interface SignUpPolicyInput {
  email: string;
  allowlist: readonly string[];
  existingUserCount: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Registration is closed unless: the allowlist is non-empty, the email is on
 * it, and no owner exists yet. Once the owner exists, sign-up is disabled for
 * everyone, including other allowlisted addresses.
 */
export function decideSignUp(input: SignUpPolicyInput): SignUpDecision {
  if (input.allowlist.length === 0) return { allowed: false, reason: "no_allowlist" };
  if (input.existingUserCount > 0) return { allowed: false, reason: "owner_exists" };
  const normalized = normalizeEmail(input.email);
  if (!input.allowlist.some((entry) => normalizeEmail(entry) === normalized)) {
    return { allowed: false, reason: "not_allowlisted" };
  }
  return { allowed: true };
}
