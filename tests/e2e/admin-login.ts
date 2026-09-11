import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, type Page } from "@playwright/test";

import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./fixture";
import {
  currentE2eTotpCode,
  resetE2eMfaReplayState,
  waitMsUntilSafeTotpWindow,
} from "./seed";

type RuntimeState = {
  dbReady?: boolean;
  databaseUrl?: string;
};

export function readE2eRuntimeState(): RuntimeState {
  const path = join(process.cwd(), "tests/e2e/.runtime-state.json");
  if (!existsSync(path)) {
    return {};
  }
  return JSON.parse(readFileSync(path, "utf8")) as RuntimeState;
}

export function requireE2eDatabase(): string {
  const state = readE2eRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (!dbReady) {
    throw new Error("e2e PostgreSQL is not ready");
  }
  return state.databaseUrl as string;
}

export async function loginE2eAdmin(page: Page): Promise<void> {
  const databaseUrl = requireE2eDatabase();
  await resetE2eMfaReplayState(databaseUrl);

  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(E2E_ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/admin\/login\/mfa/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "Vérification MFA" })).toBeVisible();

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
}
