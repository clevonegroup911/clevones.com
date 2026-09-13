import { test, expect } from "@playwright/test";

import { loginE2ePortalUser } from "./portal-login";
import { readE2eRuntimeState } from "./admin-login";
import { captureSafeEvidence } from "./safe-screenshot";

test.describe.configure({ mode: "serial" });

function skipWithoutDb() {
  const state = readE2eRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (process.env.CI) {
    expect(dbReady, "CI PostgreSQL service must be reachable for portal e2e").toBe(
      true,
    );
  } else {
    test.skip(
      !dbReady,
      "Loopback e2e PostgreSQL is required for portal USER sign-in.",
    );
  }
}

test("USER credentials open /portal and cannot open /admin", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;

  await loginE2ePortalUser(page);
  await captureSafeEvidence(page, `${project}-portal-user.png`);

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
  await captureSafeEvidence(page, `${project}-portal-user-denied-admin.png`);
});
