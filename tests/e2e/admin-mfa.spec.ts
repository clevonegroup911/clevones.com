import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./fixture";
import { captureSafeEvidence } from "./safe-screenshot";
import {
  currentE2eTotpCode,
  resetE2eMfaReplayState,
  waitMsUntilSafeTotpWindow,
} from "./seed";

test.describe.configure({ mode: "serial" });

type RuntimeState = {
  dbReady?: boolean;
  databaseUrl?: string;
};

function readRuntimeState(): RuntimeState {
  const path = join(process.cwd(), "tests/e2e/.runtime-state.json");
  if (!existsSync(path)) {
    return {};
  }
  return JSON.parse(readFileSync(path, "utf8")) as RuntimeState;
}

test("captures safe admin login and MFA screens", async ({ page }, testInfo) => {
  const project = testInfo.project.name;

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveValue("");
  await captureSafeEvidence(page, `${project}-login.png`);

  await page.goto("/admin/login/mfa");
  await expect(page.getByRole("heading", { name: "Vérification MFA" })).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "expiré" }),
  ).toBeVisible();
  await captureSafeEvidence(page, `${project}-mfa.png`);
});

test("completes fixture MFA login to the dashboard", async ({ page }, testInfo) => {
  const state = readRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (process.env.CI) {
    expect(dbReady, "CI PostgreSQL service must be reachable for MFA e2e").toBe(
      true,
    );
  } else {
    test.skip(
      !dbReady,
      "Loopback e2e PostgreSQL is required for the MFA login fixture.",
    );
  }

  const project = testInfo.project.name;
  await resetE2eMfaReplayState(state.databaseUrl as string);

  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(E2E_ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/admin\/login\/mfa/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "Vérification MFA" })).toBeVisible();
  await expect(page.locator("#code")).toHaveValue("");
  await captureSafeEvidence(page, `${project}-mfa-challenge.png`);

  const waitMs = waitMsUntilSafeTotpWindow();
  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }

  await page.locator("#code").fill(currentE2eTotpCode());
  await Promise.all([
    page.waitForURL(/\/admin\/dashboard/),
    page.getByRole("button", { name: "Vérifier" }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("E2e Admin")).toBeVisible();
  await expect(page.getByText("Super-administrateur")).toBeVisible();
  await expect(page.locator("#code")).toHaveCount(0);
  await captureSafeEvidence(page, `${project}-dashboard.png`);
});
