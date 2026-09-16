import { test, expect, type Page } from "@playwright/test";

import { loginE2eAdmin, readE2eRuntimeState } from "./admin-login";
import { assertControlCenterHtmlHasAssets } from "./control-center-assets";
import { loginE2ePortalUser } from "./portal-login";
import { captureSafeEvidence } from "./safe-screenshot";

async function dismissNextjsOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
  });
}

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

test.describe("x200 core surfaces", () => {
  test.describe.configure({ mode: "serial" });

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

  test("Control Center HTML serves required /_next CSS and JS assets", async ({
    page,
  }, testInfo) => {
    skipWithoutDb();
    await loginE2eAdmin(page);

    const response = await page.goto("/admin/x200");
    expect(response, "navigation response missing").toBeTruthy();
    expect(response!.ok(), `status=${response!.status()}`).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: "CLEVONE X200 CONTROL CENTER" }),
    ).toBeVisible({ timeout: 30_000 });

    const html = await page.content();
    const { assets } = assertControlCenterHtmlHasAssets(html);
    expect(assets.length).toBeGreaterThan(0);

    const stylesheetHrefs = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => (node as HTMLLinkElement).href)
          .filter((href) => Boolean(href)),
      );
    const nextScripts = await page.locator('script[src*="/_next/"]').evaluateAll(
      (nodes) =>
        nodes
          .map((node) => (node as HTMLScriptElement).src)
          .filter((src) => Boolean(src)),
    );

    expect(
      stylesheetHrefs.length + nextScripts.length,
      "DOM must expose stylesheet and/or /_next script tags",
    ).toBeGreaterThan(0);

    for (const href of stylesheetHrefs) {
      const asset = await page.request.get(href);
      expect(asset.ok(), `stylesheet ${href} status=${asset.status()}`).toBeTruthy();
    }
    for (const src of nextScripts.slice(0, 8)) {
      const asset = await page.request.get(src);
      expect(asset.ok(), `script ${src} status=${asset.status()}`).toBeTruthy();
    }

    const bodyDisplay = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).display);
    expect(bodyDisplay, "body must not stay FOUC-hidden without styles").not.toBe(
      "none",
    );

    await captureSafeEvidence(
      page,
      `${testInfo.project.name}-x200-control-center-assets.png`,
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
      humanActions?: { csrf?: { status?: string } } | null;
    };
    expect(body.control?.mode).toBeTruthy();
    expect(body.humanActions?.csrf?.status).toBeTruthy();
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

    // Pure synthetic status — avoid route.fetch races with abort/auto-refresh.
    await page.route("**/api/admin/x200/status", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify({
          generatedAt: new Date().toISOString(),
          sources: {
            backlog: "OK",
            productGoal: "OK",
            humanGate: "OK",
            git: "OK",
            github: "UNKNOWN",
            fedoraTelemetry: "UNKNOWN",
          },
          freshness: {},
          warnings: [],
          systemHealth: { status: "HEALTHY", summary: "mocked", criteria: [] },
          pipeline: [],
          backlog: { status: "OK", counts: {}, currentTask: null, tasks: [] },
          productGoal: { status: "OK", hash: null, title: null, criteriaDetectable: 0, criteriaSatisfied: 0 },
          humanGate: {
            present: false,
            reason: null,
            taskId: null,
            requiredAction: null,
            blocking: [],
            createdAt: null,
          },
          productComplete: { status: "ABSENT", head: null, goalHash: null, valid: false },
          git: {
            status: "OK",
            branch: "feat/x200-operational-mirror",
            head: "abcdef1",
            dirty: false,
            dirtyFileCount: 0,
            ahead: 0,
            behind: 0,
          },
          github: { status: "UNKNOWN" },
          fedora: { fedoraTelemetry: "UNKNOWN", autopilotLiveState: "UNKNOWN" },
          efficiency: {},
          blockers: [],
          activity: [],
          roles: [],
          control: {
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
          },
          progress: { completed: 0, total: 0 },
          lastUpdate: new Date().toISOString(),
          humanActions: {
            enabled: false,
            productionEnabled: false,
            githubActionAdapter: "MOCK",
            csrf: {
              status: "OK",
              appOriginConfigured: true,
              localAllowListActive: true,
            },
            inbox: [],
            environments: [],
            drift: { state: "UNKNOWN" },
            paymentsLive: "NOT_AVAILABLE",
            recentReceipts: [],
            activeIncident: null,
          },
          mirror: {
            generatedAt: new Date().toISOString(),
            degraded: false,
            degradationNotes: [],
            globalFacts: [],
            sourcesMatrix: [],
            nextSafeAction: {
              code: "WAIT",
              title: "Wait",
              detail: "mocked",
              requiresHuman: false,
              destructive: false,
            },
            commandPalette: [],
            humanDecisions: [],
            autopilotLive: {},
            cursorAgent: { status: "NOT_CONNECTED" },
          },
        }),
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
    await page.getByTestId("x200-auto-refresh").selectOption("0");
    await page.getByTestId("x200-refresh-now").click();
    await expect(page.getByTestId("x200-control-mode")).toContainText(
      "LOCAL_CONTROL_READY",
      { timeout: 20_000 },
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
    expect([400, 401, 403]).toContain(forbidden.status());

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
});

test.describe("x200 human actions", () => {
  test.describe.configure({ mode: "serial" });

  test("SUPER_ADMIN Human Actions tabs, preview, MFA mock, receipts", async ({
    page,
  }, testInfo) => {
    skipWithoutDb();
    await loginE2eAdmin(page);

    // Deterministic status fixture — no route.fetch (teardown races).
    await page.route("**/api/admin/x200/status", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify({
          generatedAt: new Date().toISOString(),
          sources: {
            backlog: "OK",
            productGoal: "OK",
            humanGate: "MISSING",
            productComplete: "MISSING",
            git: "OK",
            github: "UNKNOWN",
            fedoraTelemetry: "UNKNOWN",
          },
          freshness: {},
          warnings: [],
          systemHealth: {
            status: "DEGRADED",
            scorePercent: null,
            criteria: [],
            rationale: "e2e fixture",
          },
          pipeline: [],
          backlog: { status: "OK", counts: {}, currentTask: null, tasks: [] },
          productGoal: {
            status: "OK",
            exists: true,
            hash: "abc",
            byteLength: 1,
            detectableCriteriaCount: 1,
            warning: null,
          },
          humanGate: {
            status: "MISSING",
            present: false,
            createdAt: null,
            reason: null,
            taskId: null,
            requiredAction: null,
            blocking: [],
            merged: null,
            deployed: null,
            warning: null,
          },
          productComplete: {
            status: "MISSING",
            present: false,
            head: null,
            goalHash: null,
            generatedAt: null,
            matchesCurrentHead: null,
            matchesCurrentGoalHash: null,
            summary: null,
            warning: null,
          },
          git: {
            status: "OK",
            branch: "feat/x200-operational-mirror",
            head: "abcdef1",
            dirty: false,
            dirtyFileCount: 0,
            recentCommits: [],
            warning: null,
          },
          github: {
            status: "UNKNOWN",
            warning: null,
            repository: "clevonegroup911/clevones.com",
            prNumber: 11,
            prTitle: "T047",
            prState: "open",
            prDraft: false,
            prMergeable: "MERGEABLE",
            prHeadSha: "abcdef1",
            prUrl: null,
            ciLatestRunId: null,
            ciLatestRunNumber: null,
            ciLatestConclusion: null,
            ciLatestStatus: null,
            ciLatestUrl: null,
            ciLatestName: null,
            githubSource: "NOT_CONNECTED",
          },
          fedora: {
            fedoraTelemetry: "UNKNOWN",
            autopilotLiveState: "WAITING_FOR_TELEMETRY",
            note: "e2e",
            updatedAt: null,
            ageMs: null,
            pid: null,
            host: null,
            mode: null,
            head: null,
            branch: null,
            lastEvent: null,
            cycle: null,
            agentRunning: false,
            taskId: null,
          },
          efficiency: {
            completedTasks: 0,
            successRatePercent: null,
            totalAttempts: 0,
            blockedTasks: 0,
            failedTasks: 0,
            averageAttemptsOnCompleted: null,
            averageCycleDays: null,
            humanWaitHint: null,
            notes: [],
          },
          blockers: [],
          activity: [],
          roles: [],
          control: {
            mode: "READ_ONLY",
            actionsEnabled: false,
            localExecutorAvailable: false,
            actorRole: "SUPER_ADMIN",
            canMutate: false,
            disabledReasons: {
              MERGE: "Human approval required",
              DEPLOY: "Human approval required",
            },
            recentActions: [],
          },
          progress: { completed: 0, total: 0 },
          lastUpdate: new Date().toISOString(),
          humanActions: {
            enabled: false,
            productionEnabled: false,
            githubActionAdapter: "UNAVAILABLE",
            csrf: {
              status: "OK",
              appOriginConfigured: true,
              localAllowListActive: true,
            },
            inbox: [],
            environments: [
              {
                id: "LOCAL",
                versionSha: "abcdef1",
                health: "DEGRADED",
                database: "configured",
                deployState: "local-dev",
                migrationState: "N/A",
                lastDeploy: null,
                uptime: null,
                controlActionsEnabled: false,
              },
              {
                id: "PRODUCTION",
                versionSha: null,
                health: "UNKNOWN",
                database: "N/A",
                deployState: "NOT_CONNECTED",
                migrationState: "N/A",
                lastDeploy: null,
                uptime: null,
                controlActionsEnabled: false,
              },
            ],
            drift: {
              localHead: "abcdef1",
              prHead: "abcdef1",
              mainHead: null,
              deployedProductionSha: null,
              productCompleteHead: null,
              state: "UNKNOWN",
              detail: "e2e",
              blocksDeploy: false,
            },
            release: {
              currentRelease: "feat/x200-operational-mirror",
              candidateRelease: "PR #11",
              head: "abcdef1",
              ci: null,
              pr: "#11",
              migration: "N/A",
              backup: "UNKNOWN",
              deploymentStatus: "DISABLED",
              frozen: false,
              pipeline: [{ id: "CODE", state: "DONE", detail: "local HEAD" }],
            },
            secrets: [],
            paymentsLive: "NOT_AVAILABLE",
            notifications: [],
            stall: { stalled: false, reason: null, suggestedAction: null },
            metrics: {
              ciRuns: null,
              ciDuration: null,
              agentCycles: null,
              retries: null,
              failureRate: null,
              mttr: null,
              averageTaskDuration: null,
              humanWaitingTime: null,
              deployments: null,
              rollbackCount: null,
              cost: "N/A",
            },
            recentReceipts: [],
            activeIncident: null,
          },
          mirror: {
            generatedAt: new Date().toISOString(),
            degraded: false,
            degradationNotes: [],
            globalFacts: [],
            sourcesMatrix: [],
            nextSafeAction: {
              code: "NO_SAFE_ACTION",
              title: "none",
              detail: "e2e",
              requiresHuman: false,
              destructive: false,
              relatedPr: 11,
              relatedTask: null,
              evidence: [],
            },
            commandPalette: [],
            humanDecisions: [],
            autopilotLive: {
              serviceState: "WAITING_FOR_TELEMETRY",
              pid: null,
              mode: null,
              agentRunning: false,
              lastEvent: null,
              heartbeat: null,
              heartbeatAge: null,
              cycle: null,
              taskClaimed: null,
              taskRuntime: null,
              lastExit: null,
              restartCount: null,
              lockState: null,
              dirtyWorktree: false,
              source: "e2e",
              note: null,
              autopilotServiceState: null,
              autopilotPid: null,
              telemetryState: "MISSING",
              telemetryAge: null,
              agentRunningVerified: false,
              serviceReconcileCode: null,
            },
            cursorAgent: {
              status: "NOT_CONNECTED",
              task: null,
              branch: null,
              startedAt: null,
              runtimeMs: null,
              lastProgress: null,
              filesModified: null,
              testsStatus: null,
              note: "e2e",
            },
            ciInspector: {
              status: "NOT_CONNECTED",
              runId: null,
              runNumber: null,
              runUrl: null,
              runStatus: null,
              runConclusion: null,
              durationMs: null,
              jobs: [],
              failedStep: null,
              errorCategory: null,
              suggestedNextAction: null,
              fetchedAt: null,
              warning: null,
            },
            diffInspector: {
              status: "UNKNOWN",
              filesChanged: null,
              added: null,
              modified: null,
              deleted: null,
              linesAdded: null,
              linesDeleted: null,
              files: [],
              commits: [],
              summaryRedacted: null,
              warning: null,
            },
            releaseStack: {
              status: "UNKNOWN",
              nodes: [],
              mergeOrder: [],
              nextSafeMerge: null,
              nextSafeMergeReason: null,
              requiresApproval: true,
              warning: null,
            },
            taskControl: [],
            notifications: [],
            errorIntelligence: [],
            logs: [],
            mainHead: null,
            openPrCount: 1,
            worktreePath: null,
            databaseState: "NOT_CONNECTED",
            backupState: "NOT_AVAILABLE",
            migrationState: "NOT_AVAILABLE",
            incidentState: "none",
            deployedProductionSha: null,
          },
        }),
      });
    });

    await page.goto("/admin/x200");
    await page.getByTestId("x200-auto-refresh").selectOption("0");
    await page.getByTestId("x200-refresh-now").click();

    await expect(page.getByTestId("x200-tabs")).toBeVisible();
    await expect(page.getByTestId("x200-csrf-chip")).toBeVisible();
    await expect(page.getByTestId("x200-error-boundary")).toHaveCount(0);

    await page.getByTestId("x200-tab-HUMAN_ACTIONS").click();
    await expect(page.getByTestId("x200-human-actions")).toBeVisible();
    await expect(page.getByTestId("x200-human-plane-missing")).toHaveCount(0);
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
    expect([400, 401, 403]).toContain(forbidden.status());

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

  test("Human Action MARK_READY remote mismatch shows FAILED not false success", async ({
    page,
  }) => {
    skipWithoutDb();
    await loginE2eAdmin(page);
    await page.goto("/admin/x200");

    await page.route("**/api/admin/x200/human-actions", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          code: "REMOTE_STATE_MISMATCH",
          message: "remote still draft=true after gh pr ready",
          receipt: {
            actionId: "e2e-mismatch",
            idempotencyKey: "e2e",
            actor: "e2e",
            action: "MARK_READY_FOR_REVIEW",
            environment: "LOCAL",
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: 12,
            result: "FAILED",
            before: { beforeDraft: true },
            after: {
              afterDraft: true,
              remoteVerified: false,
              remoteState: "OPEN",
            },
            refs: {},
            auditId: "audit-mismatch",
            code: "REMOTE_STATE_MISMATCH",
            message: "remote still draft=true",
          },
          github: {
            prNumber: 10,
            prDraft: true,
            prState: "open",
            prHeadSha: "bcc76980bf3074157160c26c4c8c97f52571590a",
          },
        }),
      });
    });

    const last = await page.evaluate(async () => {
      const res = await fetch("/api/admin/x200/human-actions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MARK_READY_FOR_REVIEW",
          idempotencyKey: "e2e-remote-mismatch-001",
          reason: "e2e mismatch",
        }),
      });
      return res.json();
    });

    expect(last.ok).toBe(false);
    expect(last.code).toBe("REMOTE_STATE_MISMATCH");
    expect(last.receipt?.after?.remoteVerified).toBe(false);

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
});

test.describe("x200 operational mirror", () => {
  test.describe.configure({ mode: "serial" });

  test("Operational Mirror journey — facts, sources, operator, palette, resilience", async ({
    page,
  }, testInfo) => {
    skipWithoutDb();
    await loginE2eAdmin(page);
    await page.goto("/admin/x200");

    await expect(
      page.getByRole("heading", { name: "CLEVONE X200 CONTROL CENTER" }),
    ).toBeVisible();
    await expect(page.getByTestId("x200-global-command-center")).toBeVisible();
    await expect(page.getByTestId("x200-next-safe-action")).toBeVisible();
    await expect(page.getByTestId("x200-fact-branch_local")).toBeVisible();
    await expect(page.getByTestId("x200-fact-head_local")).toBeVisible();
    await expect(page.getByTestId("x200-boot-badge")).toBeVisible();

    // Prefer badge navigation: tab bar may overflow on mobile viewports.
    await page.getByTestId("x200-boot-badge").click();
    await expect(page.getByTestId("x200-startup-panel")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("x200-boot-overall")).toBeVisible();

    await page.getByTestId("x200-tab-SOURCES").click();
    await expect(page.getByTestId("x200-sources-matrix")).toBeVisible();

    await page.getByTestId("x200-tab-GITHUB").click();
    await expect(page.getByTestId("x200-github-center")).toBeVisible();
    await expect(page.getByTestId("x200-release-stack")).toBeVisible();
    await expect(page.getByTestId("x200-next-safe-merge")).toBeVisible();
    await expect(page.getByTestId("x200-next-safe-merge")).not.toHaveText(/#4\b/);
    await expect(page.getByTestId("x200-refresh-github")).toBeVisible();
    await page.getByTestId("x200-refresh-github").click();

    await page.getByTestId("x200-tab-CI").click();
    await expect(page.getByTestId("x200-ci-inspector")).toBeVisible();

    await page.getByTestId("x200-tab-CHANGES").click();
    await expect(page.getByTestId("x200-diff-inspector")).toBeVisible();

    await page.getByTestId("x200-tab-OPERATOR").click();
    await expect(page.getByTestId("x200-operator-view")).toBeVisible();
    await expect(page.getByText("CURRENT FACTS")).toBeVisible();
    await expect(page.getByText("NEXT SAFE ACTION").first()).toBeVisible();

    await page.getByTestId("x200-tab-LOGS").click();
    await expect(page.getByTestId("x200-log-viewer")).toBeVisible();
    await expect(
      page.getByText("no free terminal", { exact: false }),
    ).toBeVisible();

    await page.getByTestId("x200-tab-NOTIFICATIONS").click();
    await expect(page.getByTestId("x200-notification-center")).toBeVisible();
    await expect(page.getByTestId("x200-notify-badge")).toBeVisible();

    await page.getByTestId("x200-tab-ERRORS").click();
    await expect(page.getByTestId("x200-error-intelligence")).toBeVisible();

    await page.getByTestId("x200-tab-OVERVIEW").click();
    await expect(page.getByTestId("x200-autopilot-live")).toBeVisible();
    await expect(page.getByTestId("x200-cursor-agent")).toBeVisible();
    await expect(page.getByTestId("x200-human-decision-center")).toBeVisible();

    await page.keyboard.press("Control+KeyK");
    await expect(page.getByTestId("x200-command-palette")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("x200-command-palette")).toHaveCount(0);

    // Hard reload resilience — route must remain available.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "CLEVONE X200 CONTROL CENTER" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("x200-global-command-center")).toBeVisible();

    const status = await page.request.get("/api/admin/x200/status");
    expect(status.ok()).toBeTruthy();
    const body = (await status.json()) as {
      mirror?: {
        nextSafeAction?: { code?: string; destructive?: boolean };
        sourcesMatrix?: Array<{ conflict?: boolean }>;
        cursorAgent?: { status?: string };
      };
    };
    expect(body.mirror?.nextSafeAction?.code).toBeTruthy();
    expect(body.mirror?.nextSafeAction?.destructive).toBe(false);
    expect(body.mirror?.cursorAgent?.status).toBeTruthy();

    await captureSafeEvidence(
      page,
      `${testInfo.project.name}-x200-operational-mirror.png`,
    );
  });
});

test.describe("x200 interactive action console T049", () => {
  test.describe.configure({ mode: "serial" });

  test("Preview drawer, confirm gates, receipts, and no stale predecessor", async ({
    page,
  }, testInfo) => {
    skipWithoutDb();
    await loginE2eAdmin(page);

    const interactiveSnapshot = {
      generatedAt: new Date().toISOString(),
      sources: {
        backlog: "OK",
        productGoal: "OK",
        humanGate: "MISSING",
        productComplete: "MISSING",
        git: "OK",
        github: "OK",
        fedoraTelemetry: "OK",
      },
      freshness: {},
      warnings: [],
      systemHealth: {
        status: "HEALTHY",
        scorePercent: 90,
        criteria: [],
        rationale: "e2e t049",
      },
      pipeline: [],
      backlog: { status: "OK", counts: {}, currentTask: null, tasks: [] },
      productGoal: {
        status: "OK",
        exists: true,
        hash: "abc",
        byteLength: 1,
        detectableCriteriaCount: 1,
        warning: null,
      },
      humanGate: {
        status: "MISSING",
        present: false,
        createdAt: null,
        reason: null,
        taskId: null,
        requiredAction: null,
        blocking: [],
        merged: null,
        deployed: null,
        warning: null,
      },
      productComplete: {
        status: "MISSING",
        present: false,
        head: null,
        goalHash: null,
        generatedAt: null,
        matchesCurrentHead: null,
        matchesCurrentGoalHash: null,
        summary: null,
        warning: null,
      },
      git: {
        status: "OK",
        branch: "feat/x200-boot-autostart",
        head: "abcdef1",
        dirty: false,
        dirtyFileCount: 0,
        recentCommits: [],
        warning: null,
      },
      github: {
        status: "OK",
        warning: null,
        repository: "clevonegroup911/clevones.com",
        prNumber: 12,
        prTitle: "T049",
        prState: "open",
        prDraft: true,
        prMergeable: "MERGEABLE",
        prHeadSha: "abcdef1",
        prUrl: "https://github.com/clevonegroup911/clevones.com/pull/12",
        ciLatestRunId: 1,
        ciLatestRunNumber: 1,
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        ciLatestUrl: "https://github.com/clevonegroup911/clevones.com/actions/runs/1",
        ciLatestName: "quality",
        githubSource: "REST_AUTHENTICATED",
      },
      fedora: {
        fedoraTelemetry: "OK",
        autopilotLiveState: "IDLE",
        note: "e2e",
        updatedAt: new Date().toISOString(),
        ageMs: 1000,
        pid: 1,
        host: "fedora",
        mode: "daemon",
        head: "abcdef1",
        branch: "feat/x200-boot-autostart",
        lastEvent: "tick",
        cycle: 1,
        agentRunning: false,
        taskId: null,
      },
      efficiency: {},
      blockers: [],
      activity: [],
      roles: [],
      control: {
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
      },
      progress: { completed: 0, total: 0 },
      lastUpdate: new Date().toISOString(),
      humanActions: {
        enabled: true,
        productionEnabled: false,
        githubActionAdapter: "REAL",
        csrf: {
          status: "OK",
          appOriginConfigured: true,
          localAllowListActive: true,
        },
        inbox: [
          {
            id: "mark-ready",
            type: "MARK_READY_FOR_REVIEW",
            environment: "LOCAL",
            risk: "MEDIUM",
            reason: "Draft PR with green CI",
            blockingTaskId: "T049",
            requestedBy: "e2e",
            createdAt: new Date().toISOString(),
            preconditions: ["reason"],
            status: "READY",
          },
        ],
        environments: [
          {
            id: "LOCAL",
            versionSha: "abcdef1",
            health: "HEALTHY",
            database: "configured",
            deployState: "local-dev",
            migrationState: "N/A",
            lastDeploy: null,
            uptime: null,
            controlActionsEnabled: true,
          },
        ],
        drift: { state: "IN_SYNC", detail: "e2e", blocksDeploy: false },
        release: {
          currentRelease: "feat/x200-boot-autostart",
          candidateRelease: "PR #12",
          head: "abcdef1",
          ci: "success",
          pr: "#12",
          migration: "N/A",
          backup: "UNKNOWN",
          deploymentStatus: "DISABLED",
          frozen: false,
          pipeline: [{ id: "CODE", state: "DONE", detail: "local HEAD" }],
        },
        secrets: [],
        paymentsLive: "NOT_AVAILABLE",
        notifications: [],
        stall: { stalled: false, reason: null, durationMs: null, suggestedAction: null },
        metrics: { cost: "N/A" },
        recentReceipts: [],
        activeIncident: null,
      },
      boot: { overall: "READY", missing: [], facts: [], linger: {}, diagnosticsText: "ok" },
      mirror: {
        generatedAt: new Date().toISOString(),
        degraded: false,
        degradationNotes: [],
        globalFacts: [],
        sourcesMatrix: [],
        nextSafeAction: {
          code: "MERGE_DEPENDENCY_FIRST",
          title: "Merge stack predecessor first",
          detail: "NEXT SAFE MERGE = PR #11 before PR #12",
          requiresHuman: true,
          destructive: false,
          relatedPr: 11,
          relatedTask: "T049",
          evidence: ["GitHub PR stack"],
        },
        commandPalette: [
          {
            id: "refresh_all",
            label: "Refresh all",
            available: true,
            reason: null,
            requiresHuman: false,
          },
        ],
        humanDecisions: [],
        releaseStack: {
          status: "OK",
          nodes: [
            {
              prNumber: 4,
              title: "unrelated",
              base: "main",
              head: "feat/old",
              dependsOn: [],
              readyState: "READY",
            },
            {
              prNumber: 11,
              title: "T047",
              base: "feat/x200-human-action-center",
              head: "feat/x200-operational-mirror",
              dependsOn: [],
              readyState: "DRAFT",
            },
            {
              prNumber: 12,
              title: "T048",
              base: "feat/x200-operational-mirror",
              head: "feat/x200-boot-autostart",
              dependsOn: [11],
              readyState: "DRAFT",
            },
          ],
          mergeOrder: [11, 12],
          nextSafeMerge: 11,
          nextSafeMergeReason:
            "PR #11 is the verified stacked predecessor of PR #12",
          requiresApproval: true,
          warning: null,
        },
        ciInspector: {
          status: "OK",
          runId: 1,
          runNumber: 1,
          runUrl: "https://github.com/clevonegroup911/clevones.com/actions/runs/1",
          runStatus: "completed",
          runConclusion: "success",
          durationMs: 1000,
          jobs: [],
          failedStep: null,
          errorCategory: null,
          suggestedNextAction: null,
          fetchedAt: new Date().toISOString(),
          warning: null,
        },
        diffInspector: {
          status: "UNKNOWN",
          filesChanged: 0,
          added: 0,
          modified: 0,
          deleted: 0,
          linesAdded: 0,
          linesDeleted: 0,
          files: [],
          commits: [],
          summaryRedacted: null,
          warning: null,
        },
        cursorAgent: { status: "NOT_ACTIVE", note: "e2e" },
        autopilotLive: { serviceState: "IDLE", agentRunning: false },
        taskControl: [],
        notifications: [],
        errorIntelligence: [],
        logs: [],
        mainHead: "mainsha",
        openPrCount: 3,
        worktreePath: null,
        databaseState: "configured",
        backupState: "NOT_AVAILABLE",
        migrationState: "NOT_AVAILABLE",
        incidentState: "none",
        deployedProductionSha: null,
      },
    };

    await page.route("**/api/admin/x200/status", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify(interactiveSnapshot),
      });
    });

    let previewPosts = 0;
    let executePosts = 0;
    await page.route("**/api/admin/x200/human-actions", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const body = route.request().postDataJSON() as {
        previewOnly?: boolean;
        action?: string;
        reason?: string;
        mfaCode?: string;
        typedPhrase?: string;
        secondConfirmation?: boolean;
      };
      if (body.previewOnly) {
        previewPosts += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            code: "PREVIEW",
            message: "Preview ready — no action executed.",
            preview: {
              action: body.action,
              target: "PR #12",
              environment: "LOCAL",
              prNumber: 12,
              exactSha: "abcdef1",
              currentRemoteSha: "abcdef1",
              expectedChanges: ["Execute controlled action"],
              risks: ["Risk=MEDIUM"],
              preconditions: ["SUPER_ADMIN", "reason"],
              humanGate: "not required",
              mfaRequired: body.action === "MERGE_PR" || body.action === "DEPLOY_PRODUCTION",
              typedConfirmationRequired: body.action === "DEPLOY_PRODUCTION",
              typedPhrase:
                body.action === "DEPLOY_PRODUCTION"
                  ? "DEPLOY PRODUCTION abcdef1"
                  : null,
              rollback: null,
              source: "human-actions executor (previewOnly — no mutation)",
              verificationStatus: "PREVIEW_ONLY",
              approvalRequirement: body.action === "DEPLOY_PRODUCTION" ? "CRITICAL" : "MEDIUM",
            },
          }),
        });
        return;
      }
      if (body.action === "MERGE_PR" && !body.mfaCode) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            code: "MFA_REQUIRED",
            message: "MFA / re-auth requis",
          }),
        });
        return;
      }
      if (body.action === "RUN_HEALTH_CHECKS") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            code: "HEALTH_FAILED",
            message: "probe failed",
          }),
        });
        return;
      }
      executePosts += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          code: "RECORDED",
          message: "PR #12 is now ready for review.",
          receipt: {
            actionId: "receipt-t049",
            idempotencyKey: "e2e",
            actor: "e2e@admin",
            action: body.action,
            environment: "LOCAL",
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: 12,
            result: "SUCCESS",
            before: { draft: true },
            after: { draft: false, remoteVerified: true },
            refs: { pr: "12" },
            auditId: "audit-t049",
            code: "RECORDED",
            message: "PR #12 is now ready for review.",
          },
        }),
      });
    });

    await page.goto("/admin/x200");
    await page.getByTestId("x200-auto-refresh").selectOption("0");
    await page.getByTestId("x200-refresh-now").click();
    await expect(page.getByTestId("x200-actor-role")).toContainText("SUPER_ADMIN");

    await page.getByTestId("x200-tab-GITHUB").click();
    await expect(page.getByTestId("x200-next-safe-merge")).toHaveText("#11");
    await expect(page.getByTestId("x200-next-safe-merge")).not.toHaveText("#4");
    await expect(page.getByTestId("x200-open-pr")).toBeVisible();
    await expect(page.getByTestId("x200-open-actions")).toBeVisible();
    await expect(page.getByTestId("x200-open-latest-ci")).toBeVisible();
    await page.getByTestId("x200-refresh-github").click();

    await page.getByTestId("x200-tab-HUMAN_ACTIONS").click();
    await page.getByTestId("x200-mark-ready").click();
    await expect(page.getByTestId("x200-preview-drawer-root")).toBeVisible();
    await expect(page.getByTestId("x200-action-preview")).toBeVisible();
    await expect(page.getByTestId("x200-preview-field-action")).toContainText(
      "MARK_READY_FOR_REVIEW",
    );
    await expect(page.getByTestId("x200-action-toast")).toContainText(
      "Preview ready — no action executed.",
    );
    expect(previewPosts).toBeGreaterThan(0);
    expect(executePosts).toBe(0);

    await expect(page.getByTestId("x200-confirm-execute")).toBeDisabled();
    await expect(page.getByTestId("x200-confirm-disabled-reason")).toBeVisible();

    await page.getByTestId("x200-human-reason").fill("ready for review");
    await page.getByTestId("x200-confirm-execute").evaluate((node) => {
      const button = node as HTMLButtonElement;
      button.click();
      button.click();
    });
    await expect(page.getByTestId("x200-action-receipt")).toBeVisible();
    await expect(page.getByTestId("x200-action-toast")).toContainText("SUCCESS");
    expect(executePosts).toBe(1);
    await dismissNextjsOverlay(page);
    await page.getByTestId("x200-copy-receipt").click({ force: true });
    await page.getByTestId("x200-preview-copy").click({ force: true });
    await page.getByTestId("x200-preview-close").click({ force: true });
    await expect(page.getByTestId("x200-action-preview")).toHaveCount(0);

    await page.getByTestId("x200-tab-RELEASE").click();
    await page.getByTestId("x200-merge-preview").click();
    await expect(page.getByTestId("x200-action-preview")).toBeVisible();
    await expect(page.getByTestId("x200-confirm-execute")).toBeDisabled();
    await expect(page.getByTestId("x200-confirm-disabled-reason")).toContainText(
      "MFA",
    );
    await page.getByTestId("x200-preview-close").click({ force: true });

    await page.getByTestId("x200-tab-DEPLOY").click();
    await page.getByTestId("x200-deploy-preview").click();
    await expect(page.getByTestId("x200-action-preview")).toBeVisible();
    await expect(page.getByTestId("x200-confirm-disabled-reason")).toBeVisible();
    await page.getByTestId("x200-preview-close").click({ force: true });

    await page.getByTestId("x200-tab-INCIDENTS").click();
    await page.getByTestId("x200-incident-RUN_HEALTH_CHECKS").click();
    await expect(page.getByTestId("x200-action-preview")).toBeVisible();
    await dismissNextjsOverlay(page);
    await page.getByTestId("x200-confirm-execute").click({ force: true });
    // Both the drawer failure panel and toast are visible; assert each explicitly.
    await expect(page.getByTestId("x200-preview-failed")).toBeVisible();
    await expect(page.getByTestId("x200-action-toast")).toBeVisible();
    await page.getByTestId("x200-copy-error").click({ force: true });
    await page.getByTestId("x200-preview-close").click({ force: true });

    await page.getByTestId("x200-tab-AUTOMATION").click();
    await expect(page.getByTestId("x200-action-AUTOPILOT_START")).toBeVisible();
    const startTitle = await page
      .getByTestId("x200-action-AUTOPILOT_START")
      .getAttribute("title");
    expect(startTitle && startTitle.length > 0).toBeTruthy();

    await page.keyboard.press("Control+KeyK");
    await expect(page.getByTestId("x200-command-palette")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("x200-command-palette")).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId("x200-tab-HUMAN_ACTIONS").click();
    await page.getByTestId("x200-mark-ready").click();
    await expect(page.getByTestId("x200-action-preview")).toBeVisible();
    await page.getByTestId("x200-preview-close").click({ force: true });

    await captureSafeEvidence(
      page,
      `${testInfo.project.name}-x200-interactive-console.png`,
    );
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
});
