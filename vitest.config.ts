import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const shared = {
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    env: { SKIP_ENV_VALIDATION: "1" },
  },
};

export default defineConfig({
  test: {
    projects: [
      {
        ...shared,
        test: {
          ...shared.test,
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
        },
      },
      {
        ...shared,
        test: {
          ...shared.test,
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
        },
      },
      {
        ...shared,
        test: {
          ...shared.test,
          name: "db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          // DB tests share one database; run serially.
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/app/**"],
    },
  },
});
