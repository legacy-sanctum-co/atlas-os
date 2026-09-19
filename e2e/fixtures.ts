import path from "node:path";

export const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "owner@example.com";
export const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "correct-horse-battery-staple-42";

export const STORAGE_STATE = path.join(import.meta.dirname, ".auth", "owner.json");

export function expectedMode(width: number): "compact" | "portable" | "command" {
  if (width < 640) return "compact";
  if (width < 1200) return "portable";
  return "command";
}
