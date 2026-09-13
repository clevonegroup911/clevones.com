import { expect, type Page } from "@playwright/test";

import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./fixture";

export async function loginE2ePortalUser(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "Connexion portail" }),
  ).toBeVisible();
  await page.locator('input[name="email"]').fill(E2E_USER_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_USER_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/portal\/?$/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Portail documents" }),
  ).toBeVisible();
}
