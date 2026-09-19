type ClassValue = string | false | null | undefined;

/** Minimal class joiner; no runtime dependency needed at this size. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
