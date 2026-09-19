import { expect, test } from "@playwright/test";

import { OWNER_EMAIL, OWNER_PASSWORD, STORAGE_STATE, expectedMode } from "./fixtures";

test.describe("public", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated visitors are sent to sign-in with hardened headers", async ({ page }) => {
    const response = await page.goto("/");
    expect(page.url()).toContain("/sign-in");
    const headers = response?.headers() ?? {};
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toMatch(/nonce-[a-f0-9]{32}/);
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("sign-in page has no horizontal overflow and a focusable form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Atlas" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();
  });
});

test.describe("owner environment", () => {
  test.use({ storageState: STORAGE_STATE });

  test("the environment resolves the right mode for this viewport", async ({ page }, testInfo) => {
    await page.goto("/");
    const width = testInfo.project.use.viewport?.width ?? 0;
    const mode = expectedMode(width);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(OWNER_EMAIL)).toBeVisible();

    const shell = page.locator(".atlas-shell");
    await expect(shell).toBeVisible();
    const cssMode = await shell.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--env").trim().replaceAll('"', ""),
    );
    expect(cssMode).toBe(mode);

    if (mode === "compact") {
      await expect(page.getByRole("navigation", { name: "Command dock" })).toBeVisible();
      await expect(page.getByRole("complementary", { name: "Environment rail" })).toBeHidden();
    } else {
      await expect(page.getByRole("complementary", { name: "Environment rail" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Command dock" })).toBeHidden();
      await expect(page.getByTestId("environment-mode")).toHaveText(mode);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("security page renders passkey management", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Security" }).first().click();
    await expect(page.getByRole("heading", { name: "Owner access" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add passkey" })).toBeVisible();
  });
});

test.describe("sign-out", () => {
  // A fresh session per test so revoking it does not affect other projects.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sign-out revokes the session server-side", async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "laptop", "one project is enough for this flow");

    const response = await request.post("/api/auth/sign-in/email", {
      data: { email: OWNER_EMAIL, password: OWNER_PASSWORD },
      headers: { Origin: testInfo.project.use.baseURL ?? "" },
    });
    expect(response.ok()).toBe(true);
    await page.context().addCookies(await request.storageState().then((s) => s.cookies));

    await page.goto("/security");
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await page.waitForURL("**/sign-in");
    await page.goto("/security");
    expect(page.url()).toContain("/sign-in");
  });
});
