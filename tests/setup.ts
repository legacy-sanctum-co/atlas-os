import "@testing-library/jest-dom/vitest";

// `server-only` throws when imported outside a React Server Components
// bundle. Tests import server modules directly, so neutralize it.
vi.mock("server-only", () => ({}));

// Next.js request APIs are not available in unit tests; individual tests mock
// what they need.
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));
