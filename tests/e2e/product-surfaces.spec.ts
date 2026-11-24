import { test, expect } from "@playwright/test";

import { loginE2eAdmin, readE2eRuntimeState } from "./admin-login";
import { E2E_ORIGIN } from "./env";
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

  for (const path of ["/admin/cms", "/admin/analytics"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
  }

  await page.goto("/portal");
  await expect(page).toHaveURL(/\/sign-in/);

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
    headers: {
      origin: E2E_ORIGIN,
      "x-forwarded-for": `198.51.100.${project === "mobile" ? 21 : 11}${testInfo.retry}`,
    },
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

test("product inquiry path shows the short form without governance fields", async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;

  for (const path of ["/collaboration?intent=product", "/contact?intent=product"]) {
    await page.goto(path);
    const form = page.getByTestId("product-inquiry-form");
    await expect(form).toBeVisible();
    for (const name of [
      "organizationName",
      "contactPerson",
      "professionalEmail",
      "phone",
      "location",
      "estimatedUsers",
    ]) {
      await expect(form.locator(`input[name="${name}"]`)).toBeVisible();
    }
    await expect(form.locator('select[name="product"]')).toBeVisible();
    await expect(form.locator('textarea[name="need"]')).toBeVisible();
    await expect(form.locator('input[name="privacyConsent"]')).toBeVisible();
    for (const name of [
      "availableDocumentation",
      "complianceStatus",
      "territoryConcerned",
      "governanceAcknowledgment",
      "legalStatus",
    ]) {
      await expect(page.locator(`[name="${name}"]`)).toHaveCount(0);
    }
  }

  await captureSafeEvidence(page, `${project}-contact-product.png`);
});

test("product inquiry submits successfully with fixture data", async ({ page }) => {
  await page.goto("/collaboration?intent=product");
  const form = page.getByTestId("product-inquiry-form");
  await form.locator('input[name="organizationName"]').fill("E2E Fixture SARL");
  await form.locator('input[name="contactPerson"]').fill("E2E Buyer");
  await form
    .locator('input[name="professionalEmail"]')
    .fill("e2e.buyer@example.test");
  await form.locator('input[name="location"]').fill("Kisangani, RDC");
  await form.locator('select[name="product"]').selectOption("clevone-dms");
  await form.locator('input[name="estimatedUsers"]').fill("8");
  await form
    .locator('textarea[name="need"]')
    .fill("Fixture e2e : suivi des ventes et des stocks. Pas une donnée de production.");
  await form.locator('input[name="privacyConsent"]').check();
  await form.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByRole("status")).toContainText("Demande reçue");
});

test("contact API refuses cross-origin posts and rate-limits per IP", async ({
  page,
}, testInfo) => {
  const crossOrigin = await page.request.post("/api/initiative-submission", {
    headers: { origin: "https://evil.example" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  const refused = (await crossOrigin.json()) as { success?: boolean; error?: string };
  expect(refused.success).toBe(false);
  expect(refused.error ?? "").not.toMatch(/csrf|referer/i);

  // Unique IP per project and retry so the quota never leaks into other tests.
  const ip = `203.0.113.${testInfo.project.name === "mobile" ? 2 : 1}${testInfo.retry}`;
  const headers = { origin: E2E_ORIGIN, "x-forwarded-for": ip };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await page.request.post("/api/initiative-submission", {
      headers,
      data: { intent: "product" },
    });
    expect(response.status()).toBe(400);
  }
  const limited = await page.request.post("/api/initiative-submission", {
    headers,
    data: { intent: "product" },
  });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
  const body = (await limited.json()) as { success?: boolean; error?: string };
  expect(body.success).toBe(false);
  expect(body.error).toMatch(/too many submissions/i);
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
