import { expect, test as setup } from "@playwright/test";

import { OWNER_EMAIL, OWNER_PASSWORD, STORAGE_STATE } from "./fixtures";

/**
 * Authenticates once per run through the real sign-in form (bootstrapping
 * the owner when the database is empty) and persists the session cookie for
 * every viewport project. Keeps the run under the sign-in rate limit.
 */
setup("owner signs in (or bootstraps) once", async ({ page }) => {
  await page.goto("/sign-in");
  const bootstrap = await page.getByRole("button", { name: "Create owner account" }).isVisible();
  if (bootstrap) await page.getByLabel("Name").fill("Owner");
  await page.getByLabel("Email").fill(OWNER_EMAIL);
  await page.getByLabel("Password").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: bootstrap ? "Create owner account" : "Enter" }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
