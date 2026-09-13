import { test, expect } from "@playwright/test";

import { loginE2eAdmin, readE2eRuntimeState } from "./admin-login";
import { loginE2ePortalUser } from "./portal-login";
import { captureSafeEvidence } from "./safe-screenshot";

test.describe.configure({ mode: "serial" });

function skipWithoutDb() {
  const state = readE2eRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (process.env.CI) {
    expect(dbReady, "CI PostgreSQL service must be reachable for x200 e2e").toBe(
      true,
    );
  } else {
    test.skip(
      !dbReady,
      "Loopback e2e PostgreSQL is required for authenticated /admin/x200.",
    );
  }
}

test("unauthenticated users cannot open /admin/x200", async ({ page }) => {
  await page.goto("/admin/x200");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("portal USER cannot open /admin/x200", async ({ page }, testInfo) => {
  skipWithoutDb();
  await loginE2ePortalUser(page);
  await page.goto("/admin/x200");
  await expect(page).toHaveURL(/\/admin\/login/);
  await captureSafeEvidence(
    page,
    `${testInfo.project.name}-x200-user-denied.png`,
  );
});

test("admin Control Center shows real cards, registry, gate, telemetry placeholders", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;
  await loginE2eAdmin(page);

  await page.goto("/admin/x200");
  await expect(
    page.getByRole("heading", { name: "CLEVONE X200 CONTROL CENTER" }),
  ).toBeVisible();

  await expect(page.getByTestId("card-system-health")).toBeVisible();
  await expect(page.getByTestId("card-autoplan")).toBeVisible();
  await expect(page.getByTestId("card-current-task")).toBeVisible();
  await expect(page.getByTestId("card-active-agent")).toBeVisible();
  await expect(page.getByTestId("card-ci-status")).toBeVisible();
  await expect(page.getByTestId("card-human-gate")).toBeVisible();
  await expect(page.getByTestId("card-worktree")).toBeVisible();
  await expect(page.getByTestId("x200-task-registry")).toBeVisible();
  await expect(page.getByTestId("x200-pipeline")).toBeVisible();

  await expect(page.getByText("FEDORA TELEMETRY = NOT_CONNECTED")).toBeVisible();
  await expect(
    page.getByText("AUTOPILOT LIVE STATE = WAITING_FOR_TELEMETRY"),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Toutes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "En cours" })).toBeVisible();
  await expect(page.getByPlaceholder("Recherche ID / titre")).toBeVisible();

  const status = await page.request.get("/api/admin/x200/status");
  expect(status.ok()).toBeTruthy();
  const body = (await status.json()) as {
    sources?: { fedoraTelemetry?: string; github?: string };
    systemHealth?: { status?: string; scorePercent?: number | null };
    github?: { ciLatestConclusion?: string | null };
  };
  expect(body.sources?.fedoraTelemetry).toBe("NOT_CONNECTED");
  expect(["OK", "UNKNOWN", "ERROR", "MISSING"]).toContain(
    body.sources?.github ?? "",
  );
  expect(["HEALTHY", "DEGRADED", "BLOCKED", "UNKNOWN"]).toContain(
    body.systemHealth?.status ?? "",
  );
  // Never invent a green CI conclusion in the payload when GitHub is unknown.
  if (body.sources?.github === "UNKNOWN") {
    expect(body.github?.ciLatestConclusion ?? null).toBeNull();
  }

  const screenshotName =
    project === "mobile"
      ? "mobile-x200-control-center.png"
      : "desktop-x200-control-center.png";
  await captureSafeEvidence(page, screenshotName);
});
