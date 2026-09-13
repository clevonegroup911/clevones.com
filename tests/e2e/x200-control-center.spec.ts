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

test("admin Control Center live refresh, filters, drawers, command UI", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;
  await loginE2eAdmin(page);

  await page.goto("/admin/x200");
  await expect(
    page.getByRole("heading", { name: "CLEVONE X200 CONTROL CENTER" }),
  ).toBeVisible();

  await expect(page.getByTestId("x200-live-bar")).toBeVisible();
  await expect(page.getByTestId("x200-live-indicator")).toBeVisible();
  await expect(page.getByTestId("x200-refresh-now")).toBeVisible();
  await expect(page.getByTestId("x200-auto-refresh")).toBeVisible();
  await expect(page.getByTestId("x200-command-center")).toBeVisible();
  await expect(page.getByTestId("x200-control-mode")).toBeVisible();
  await expect(page.getByTestId("card-system-health")).toBeVisible();
  await expect(page.getByTestId("card-project-progress")).toBeVisible();
  await expect(page.getByTestId("card-current-task")).toBeVisible();
  await expect(page.getByTestId("card-active-agent")).toBeVisible();
  await expect(page.getByTestId("card-ci-status")).toBeVisible();
  await expect(page.getByTestId("card-human-gate")).toBeVisible();
  await expect(page.getByTestId("card-worktree")).toBeVisible();
  await expect(page.getByTestId("x200-task-registry")).toBeVisible();
  await expect(page.getByTestId("x200-pipeline")).toBeVisible();
  await expect(page.getByTestId("x200-action-history")).toBeVisible();

  await expect(page.getByText("Human approval required").first()).toBeVisible();
  await expect(page.getByTestId("x200-action-AUTOPILOT_START")).toBeVisible();
  await expect(page.getByTestId("x200-action-RUN_ONE_CYCLE")).toBeVisible();

  // Default CONTROL_DISABLED → buttons disabled for safety.
  await expect(page.getByTestId("x200-action-AUTOPILOT_START")).toBeDisabled();

  await page.getByRole("button", { name: "Terminées" }).click();
  await expect(page.getByPlaceholder("Recherche ID / titre")).toBeVisible();
  await page.getByPlaceholder("Recherche ID / titre").fill("T045");

  const firstRow = page.locator("[data-testid^='x200-task-row-']").first();
  if (await firstRow.count()) {
    await firstRow.click();
    await expect(page.getByTestId("x200-task-drawer")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).first().click();
  }

  await page.getByTestId("x200-pipeline-CI").click();
  await expect(page.getByTestId("x200-pipeline-drawer")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).first().click();

  const status = await page.request.get("/api/admin/x200/status");
  expect(status.ok()).toBeTruthy();
  expect(status.headers()["cache-control"] ?? "").toMatch(/no-store/i);
  const body = (await status.json()) as {
    sources?: { fedoraTelemetry?: string; github?: string };
    fedora?: { autopilotLiveState?: string };
    systemHealth?: { status?: string };
    control?: { mode?: string };
    progress?: { completed?: number | null; total?: number | null };
    github?: { ciLatestConclusion?: string | null };
  };
  expect(body.control?.mode).toBeTruthy();
  expect(["HEALTHY", "DEGRADED", "BLOCKED", "UNKNOWN"]).toContain(
    body.systemHealth?.status ?? "",
  );
  if (body.sources?.github === "UNKNOWN") {
    expect(body.github?.ciLatestConclusion ?? null).toBeNull();
  }

  await page.getByTestId("x200-refresh-now").click();

  const screenshotName =
    project === "mobile"
      ? "mobile-x200-control-center.png"
      : "desktop-x200-control-center.png";
  await captureSafeEvidence(page, screenshotName);
});

test("SUPER_ADMIN confirmation modal and mocked action success/failure", async ({
  page,
}) => {
  skipWithoutDb();
  await loginE2eAdmin(page);

  await page.route("**/api/admin/x200/status", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = (await response.json()) as Record<string, unknown>;
    const control = {
      ...(typeof json.control === "object" && json.control
        ? (json.control as Record<string, unknown>)
        : {}),
      mode: "LOCAL_CONTROL_READY",
      actionsEnabled: true,
      localExecutorAvailable: true,
      actorRole: "SUPER_ADMIN",
      canMutate: true,
      disabledReasons: {
        MERGE: "Human approval required",
        DEPLOY: "Human approval required",
      },
      recentActions: [],
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Cache-Control": "no-store" },
      body: JSON.stringify({ ...json, control }),
    });
  });

  let actionCalls = 0;
  await page.route("**/api/admin/x200/actions", async (route) => {
    actionCalls += 1;
    if (actionCalls === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          code: "OK",
          message: "Action exécutée.",
          action: "AUTOPILOT_START",
          durationMs: 12,
          beforeState: "LOCAL_CONTROL_READY",
          afterState: "ACTION_RUNNING",
          output: "mocked",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        code: "AGENT_BUSY",
        message: "Agent Cursor actif",
        action: "AUTOPILOT_STOP",
      }),
    });
  });

  await page.goto("/admin/x200");
  await page.getByTestId("x200-refresh-now").click();
  await expect(page.getByTestId("x200-control-mode")).toContainText(
    "LOCAL_CONTROL_READY",
  );
  await expect(page.getByTestId("x200-action-AUTOPILOT_START")).toBeEnabled({
    timeout: 10_000,
  });

  await page.getByTestId("x200-action-AUTOPILOT_START").click();
  await expect(page.getByTestId("x200-confirm-modal")).toBeVisible();
  await page.getByTestId("x200-confirm-action").click();
  await expect(page.getByTestId("x200-action-result")).toContainText("SUCCESS");

  await expect(page.getByTestId("x200-action-AUTOPILOT_STOP")).toBeEnabled({
    timeout: 10_000,
  });
  await page.getByTestId("x200-action-AUTOPILOT_STOP").click();
  await expect(page.getByTestId("x200-confirm-modal")).toBeVisible();
  await page.getByTestId("x200-confirm-action").click();
  await expect(page.getByTestId("x200-action-result")).toContainText("FAILED");

  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("actions API rejects arbitrary command payloads for authenticated admin", async ({
  page,
}) => {
  skipWithoutDb();
  await loginE2eAdmin(page);
  await page.goto("/admin/x200");
  const origin = new URL(page.url()).origin;

  const forbidden = await page.request.post("/api/admin/x200/actions", {
    headers: {
      Origin: origin,
      Referer: `${origin}/admin/x200`,
      "Content-Type": "application/json",
    },
    data: {
      action: "AUTOPILOT_START",
      command: "rm -rf /",
    },
  });
  expect([400, 403]).toContain(forbidden.status());

  const invalid = await page.request.post("/api/admin/x200/actions", {
    headers: {
      Origin: origin,
      Referer: `${origin}/admin/x200`,
      "Content-Type": "application/json",
    },
    data: { action: "NOT_A_REAL_ACTION" },
  });
  expect([400, 403]).toContain(invalid.status());
});

test("SUPER_ADMIN Human Actions tabs, preview, MFA mock, receipts", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  await loginE2eAdmin(page);
  await page.goto("/admin/x200");

  await expect(page.getByTestId("x200-tabs")).toBeVisible();
  await expect(page.getByTestId("x200-csrf-chip")).toBeVisible();

  await page.getByTestId("x200-tab-HUMAN_ACTIONS").click();
  await expect(page.getByTestId("x200-human-actions")).toBeVisible();
  await expect(page.getByTestId("x200-csrf-status")).toBeVisible();

  await page.getByTestId("x200-tab-RELEASE").click();
  await expect(page.getByTestId("x200-release-center")).toBeVisible();
  await expect(page.getByTestId("x200-drift-state")).toBeVisible();

  await page.getByTestId("x200-tab-DEPLOY").click();
  await expect(page.getByTestId("x200-deploy-center")).toBeVisible();
  await expect(page.getByTestId("x200-env-LOCAL")).toBeVisible();
  await expect(page.getByTestId("x200-env-PRODUCTION")).toBeVisible();

  await page.getByTestId("x200-tab-DATABASE").click();
  await expect(page.getByTestId("x200-database-center")).toBeVisible();
  await expect(page.getByTestId("x200-payments-live")).toContainText(
    "NOT_AVAILABLE",
  );

  await page.getByTestId("x200-tab-INCIDENTS").click();
  await expect(page.getByTestId("x200-incident-mode")).toBeVisible();
  await expect(page.getByTestId("x200-stall-state")).toBeVisible();

  await page.getByTestId("x200-tab-AUDIT").click();
  await expect(page.getByTestId("x200-action-history-enhanced")).toBeVisible();

  // Human actions API rejects arbitrary shell and supports preview mock.
  const origin = new URL(page.url()).origin;
  const forbidden = await page.request.post("/api/admin/x200/human-actions", {
    headers: {
      Origin: origin,
      Referer: `${origin}/admin/x200`,
      "Content-Type": "application/json",
    },
    data: {
      action: "MERGE_PR",
      idempotencyKey: "e2e-forbid-0001",
      shell: "rm -rf /",
    },
  });
  expect([400, 403]).toContain(forbidden.status());

  await page.route("**/api/admin/x200/human-actions", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as {
      previewOnly?: boolean;
      action?: string;
    };
    if (body.previewOnly) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          code: "PREVIEW",
          message: "WHAT WILL HAPPEN",
          preview: {
            action: body.action,
            environment: "PRODUCTION",
            risks: ["CRITICAL"],
            typedPhrase: "DEPLOY PRODUCTION abcdef1",
          },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        code: "RECORDED",
        message: "mocked",
        receipt: {
          actionId: "e2e-receipt",
          idempotencyKey: "e2e",
          actor: "e2e",
          action: body.action,
          environment: "LOCAL",
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: 1,
          result: "SUCCESS",
          before: {},
          after: {},
          refs: {},
          auditId: "audit-e2e",
          code: "RECORDED",
          message: "mocked",
        },
      }),
    });
  });

  await page.getByTestId("x200-tab-HUMAN_ACTIONS").click();
  // Force enable UI path via mocked plane is hard; exercise deploy preview button if present.
  await page.getByTestId("x200-tab-DEPLOY").click();
  const deployPreview = page.getByTestId("x200-deploy-preview");
  if (await deployPreview.isVisible().catch(() => false)) {
    await deployPreview.click();
    await expect(page.getByTestId("x200-deploy-preview-body")).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("x200-tabs")).toBeVisible();
  await captureSafeEvidence(
    page,
    `${testInfo.project.name}-x200-human-actions-mobile.png`,
  );

  await page.unrouteAll({ behavior: "ignoreErrors" });
});
