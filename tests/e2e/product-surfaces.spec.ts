import { test, expect } from "@playwright/test";

import { loginE2eAdmin, readE2eRuntimeState } from "./admin-login";
import { captureSafeEvidence } from "./safe-screenshot";

test.describe.configure({ mode: "serial" });

function skipWithoutDb() {
  const state = readE2eRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (process.env.CI) {
    expect(dbReady, "CI PostgreSQL service must be reachable for product e2e").toBe(
      true,
    );
  } else {
    test.skip(
      !dbReady,
      "Loopback e2e PostgreSQL is required for authenticated product surfaces.",
    );
  }
}

test("unauthenticated users cannot open CMS, analytics, or the document portal", async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;

  for (const path of ["/admin/cms", "/admin/analytics", "/portal"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
  }

  await captureSafeEvidence(page, `${project}-product-unauth-login.png`);
});

test("public contact has no live payment keys and accepts a fixture initiative", async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const html = await page.content();
  expect(html).not.toMatch(/sk_live|pk_live|whsec_/i);
  await expect(page.locator('input[name="organizationName"]')).toBeVisible();
  await captureSafeEvidence(page, `${project}-contact-public.png`);

  const response = await page.request.post("/api/initiative-submission", {
    data: {
      organizationName: "E2E Fixture Org",
      legalStatus: "ASBL",
      country: "CD",
      contactPerson: "E2E Reviewer",
      professionalEmail: "e2e.reviewer@example.test",
      actorType: "institution",
      initiativeTitle: "E2E structured initiative",
      initiativeStage: "documented-initiative",
      shortDescription:
        "Playwright fixture submission used only in ephemeral e2e. Not production data.",
      territoryConcerned: "Kinshasa",
      complianceStatus: "Documented for fixture review only.",
      expectedCollaborationType: "Institutional review",
      complianceConfirmation: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { success?: boolean };
  expect(body.success).toBe(true);

  const checkout = await page.request.get("/checkout");
  expect(checkout.status()).toBeGreaterThanOrEqual(400);
});

test("authenticated admin can open CMS, analytics, and upload a private document", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;

  await loginE2eAdmin(page);

  await page.goto("/admin/cms");
  await expect(page.getByRole("heading", { name: "CMS" })).toBeVisible();
  await page.locator('input[name="title"]').fill(`E2E CMS ${project}`);
  await Promise.all([
    page.waitForURL(/\/admin\/cms\/[^/]+$/),
    page.getByRole("button", { name: "Créer" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: `E2E CMS ${project}` })).toBeVisible();
  await captureSafeEvidence(page, `${project}-cms.png`);

  await page.goto("/admin/analytics");
  await expect(
    page.getByRole("heading", { name: "Analytics first-party" }),
  ).toBeVisible();
  await expect(page.getByText("Vues pages")).toBeVisible();
  await captureSafeEvidence(page, `${project}-analytics.png`);

  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: "Portail documents" })).toBeVisible();
  await page.locator('input[name="title"]').fill(`E2E doc ${project}`);
  await page.locator('input[name="file"]').setInputFiles({
    name: "e2e-fixture.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("e2e private document fixture"),
  });
  await page.getByRole("button", { name: "Uploader" }).click();
  await expect(page.getByText(`E2E doc ${project}`)).toBeVisible();
  await captureSafeEvidence(page, `${project}-portal.png`);
});
