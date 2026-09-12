import { test, expect, type Page } from "@playwright/test";

import { loginE2eAdmin, readE2eRuntimeState } from "./admin-login";
import { captureSafeEvidence } from "./safe-screenshot";

test.describe.configure({ mode: "serial" });

function skipWithoutDb() {
  const state = readE2eRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (process.env.CI) {
    expect(dbReady, "CI PostgreSQL service must be reachable for users e2e").toBe(
      true,
    );
  } else {
    test.skip(
      !dbReady,
      "Loopback e2e PostgreSQL is required for users + DocumentGrant e2e.",
    );
  }
}

async function clearAllSessions(page: Page): Promise<void> {
  await page.context().clearCookies();
}

async function loginPortalUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "Connexion portail" }),
  ).toBeVisible();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/portal\/?$/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Portail documents" }),
  ).toBeVisible();
}

test("users + DocumentGrant: admin create USER, grant access, deny without grant", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;
  const stamp = `${Date.now().toString(36)}-${testInfo.workerIndex}`;
  const email = `grant.user.${stamp}@example.test`;
  const password = "PortalAccess!2026xY";
  const docTitle = `E2E users grant doc ${project} ${stamp}`;

  await loginE2eAdmin(page);

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Utilisateurs" })).toBeVisible();

  const createSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Créer un compte" }) });
  await createSection.locator('input[name="email"]').fill(email);
  await createSection.locator('input[name="firstName"]').fill("Grant");
  await createSection.locator('input[name="lastName"]').fill("Client");
  await createSection.locator('input[name="password"]').fill(password);
  await createSection.locator('select[name="role"]').selectOption("USER");
  await createSection.getByRole("button", { name: "Créer" }).click();
  await expect(page.getByText(`Compte ${email} créé.`)).toBeVisible();

  const userRow = page.locator("li").filter({ hasText: email }).first();
  await expect(userRow.getByText(/USER · ACTIVE/)).toBeVisible();
  const userIdText = await userRow.locator("p").nth(1).innerText();
  const userId = userIdText.split("·").pop()?.trim();
  expect(userId).toBeTruthy();

  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: "Portail documents" })).toBeVisible();

  const upload = await page.request.post("/api/portal/documents", {
    multipart: {
      title: docTitle,
      description: "Fixture DocumentGrant e2e — never production.",
      category: "OTHER",
      accessLevel: "PRIVATE",
      file: {
        name: "e2e-users-grant.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(`e2e users document grant fixture ${stamp}`),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const uploaded = (await upload.json()) as { id?: string };
  expect(uploaded.id).toBeTruthy();
  const documentId = uploaded.id as string;

  await clearAllSessions(page);
  await loginPortalUser(page, email, password);
  await expect(page.getByText(docTitle)).toHaveCount(0);
  await expect(page.getByText("Aucun document.")).toBeVisible();

  const denied = await page.request.get(`/api/portal/documents/${documentId}`);
  expect(denied.status()).toBe(403);
  const deniedBody = (await denied.json()) as { error?: string };
  expect(deniedBody.error).toMatch(/refus/i);
  await captureSafeEvidence(page, `${project}-users-no-grant.png`);

  await clearAllSessions(page);
  await loginE2eAdmin(page);
  await page.goto("/admin/users");
  await expect(
    page.getByRole("heading", { name: "DocumentGrant" }),
  ).toBeVisible();

  const grantForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Créer le grant" }) });
  await grantForm.locator('input[name="documentId"]').fill(documentId);
  await grantForm.locator('input[name="userId"]').fill(userId!);
  await grantForm.getByRole("button", { name: "Créer le grant" }).click();
  await expect(page.getByText("Grant créé.")).toBeVisible();
  await expect(page.getByText(`${docTitle} → ${email}`)).toBeVisible();
  await captureSafeEvidence(page, `${project}-users-grant-created.png`);

  await clearAllSessions(page);
  await loginPortalUser(page, email, password);
  await expect(page.getByText(docTitle)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Télécharger" }).first(),
  ).toBeVisible();

  const allowed = await page.request.get(`/api/portal/documents/${documentId}`);
  expect(allowed.ok()).toBeTruthy();
  expect(allowed.headers()["content-type"]).toMatch(/text\/plain/);
  const body = await allowed.text();
  expect(body).toContain("e2e users document grant fixture");
  await captureSafeEvidence(page, `${project}-users-with-grant.png`);
});
