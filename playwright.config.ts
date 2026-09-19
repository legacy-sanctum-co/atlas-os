import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E across the five verification widths (ADR 0008). Runs against a
 * production build so behavior matches deployment. Requires DATABASE_URL.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm next start --port ${PORT}`,
    url: `${baseURL}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: baseURL,
      BETTER_AUTH_URL: baseURL,
    },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-narrow",
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } },
    },
    {
      name: "fold-cover",
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], viewport: { width: 376, height: 880 } },
    },
    {
      name: "fold-open",
      dependencies: ["setup"],
      use: { ...devices["Galaxy Tab S4"], viewport: { width: 840, height: 880 } },
    },
    {
      name: "laptop",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "desktop-wide",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
