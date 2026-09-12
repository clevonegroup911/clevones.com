import { test, expect } from "@playwright/test";

import { loginE2eAdmin, readE2eRuntimeState } from "./admin-login";
import { captureSafeEvidence } from "./safe-screenshot";

test.describe.configure({ mode: "serial" });

function skipWithoutDb() {
  const state = readE2eRuntimeState();
  const dbReady = state.dbReady === true && typeof state.databaseUrl === "string";
  if (process.env.CI) {
    expect(dbReady, "CI PostgreSQL service must be reachable for payments e2e").toBe(
      true,
    );
  } else {
    test.skip(
      !dbReady,
      "Loopback e2e PostgreSQL is required for gateway payments e2e.",
    );
  }
}

test("payments gateway sandbox: seed → proof PENDING → CLEVONE reconcile → VERIFIED receipt", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;
  const reference = `E2E-PAY-${project}-${Date.now().toString(36)}`;

  await loginE2eAdmin(page);

  await page.goto("/admin/payments");
  await expect(page.getByRole("heading", { name: "Paiements gateway" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /File HUMAN_REVIEW/ }),
  ).toBeVisible();
  const htmlAdmin = await page.content();
  expect(htmlAdmin).not.toMatch(/sk_live|pk_live|whsec_|MPESA_CONSUMER/i);
  await captureSafeEvidence(page, `${project}-payments-admin.png`);

  const seed = await page.request.post("/api/admin/payments/sandbox", {
    data: {
      title: `E2E gateway ${project}`,
      amountCents: 3400,
      currency: "USD",
      settle: false,
    },
  });
  expect(seed.ok()).toBeTruthy();
  const seeded = (await seed.json()) as {
    orderId: string;
    paymentId: string;
    invoiceId: string;
  };
  expect(seeded.paymentId).toBeTruthy();

  await page.goto("/portal/payments");
  await expect(page.getByRole("heading", { name: "Mes paiements" })).toBeVisible();
  await expect(page.getByText(`E2E gateway ${project}`)).toBeVisible();

  const proofForm = page.locator("form").filter({ hasText: "Envoyer preuve" }).first();
  await proofForm.locator('input[name="reference"]').fill(reference);
  await proofForm.locator('input[name="file"]').setInputFiles({
    name: "e2e-proof.png",
    mimeType: "image/png",
    buffer: Buffer.from("e2e-payment-proof-fixture"),
  });
  await proofForm.getByRole("button", { name: "Envoyer preuve" }).click();
  await expect(page.getByText(/PENDING|source CLEVONE|pas de validation/i)).toBeVisible();
  await captureSafeEvidence(page, `${project}-payments-portal-proof.png`);

  const eventRes = await page.request.post("/api/admin/payments/clevone-event", {
    data: {
      paymentId: seeded.paymentId,
      invoiceId: seeded.invoiceId,
      reference,
      amountCents: 3400,
      currency: "USD",
      source: "CLEVONE_SANDBOX",
    },
  });
  expect(eventRes.ok()).toBeTruthy();
  const eventBody = (await eventRes.json()) as { authenticated?: boolean };
  expect(eventBody.authenticated).toBe(true);

  const reconcileRes = await page.request.post("/api/admin/payments/reconcile", {
    data: {
      paymentId: seeded.paymentId,
      invoiceId: seeded.invoiceId,
    },
  });
  expect(reconcileRes.ok()).toBeTruthy();
  const reconciled = (await reconcileRes.json()) as {
    status?: string;
    allowsCapture?: boolean;
  };
  expect(reconciled.status).toBe("VERIFIED");
  expect(reconciled.allowsCapture).toBe(true);

  const activateRes = await page.request.post("/api/admin/payments/activate", {
    data: {
      paymentId: seeded.paymentId,
    },
  });
  expect(activateRes.ok()).toBeTruthy();
  const activated = (await activateRes.json()) as {
    orderStatus?: string;
    invoiceStatus?: string;
    receiptNumber?: string | null;
  };
  expect(activated.orderStatus).toBe("ACTIVE");
  expect(activated.invoiceStatus).toBe("SETTLED");
  expect(activated.receiptNumber).toBeTruthy();

  await page.goto("/portal/payments");
  await expect(page.getByText(activated.receiptNumber!).first()).toBeVisible();
  await expect(page.getByText(/Reçu disponible/i).first()).toBeVisible();
  await captureSafeEvidence(page, `${project}-payments-receipt.png`);
});

test("payments gateway sandbox: mismatch → HUMAN_REVIEW → approve activates", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;

  await loginE2eAdmin(page);

  const seed = await page.request.post("/api/admin/payments/sandbox", {
    data: {
      title: `E2E review ${project}`,
      amountCents: 2100,
      currency: "USD",
      settle: false,
    },
  });
  expect(seed.ok()).toBeTruthy();
  const seeded = (await seed.json()) as {
    paymentId: string;
    invoiceId: string;
  };

  await page.request.post("/api/admin/payments/clevone-event", {
    data: {
      paymentId: seeded.paymentId,
      invoiceId: seeded.invoiceId,
      reference: `E2E-MIS-${project}`,
      amountCents: 9999,
      currency: "USD",
      source: "CLEVONE_SANDBOX",
    },
  });

  const reconcileRes = await page.request.post("/api/admin/payments/reconcile", {
    data: { paymentId: seeded.paymentId, invoiceId: seeded.invoiceId },
  });
  expect(reconcileRes.ok()).toBeTruthy();
  const reconciled = (await reconcileRes.json()) as {
    status?: string;
    decisionId?: string;
    reviewDueAt?: string | null;
  };
  expect(reconciled.status).toBe("HUMAN_REVIEW");
  expect(reconciled.reviewDueAt).toBeTruthy();
  expect(reconciled.decisionId).toBeTruthy();

  await page.goto("/admin/payments");
  await expect(
    page.getByRole("heading", { name: /File HUMAN_REVIEW/ }),
  ).toBeVisible();
  await expect(page.getByText(/échéance indicative/i).first()).toBeVisible();

  const reviewRes = await page.request.post("/api/admin/payments/review", {
    data: {
      decisionId: reconciled.decisionId,
      action: "approve",
    },
  });
  expect(reviewRes.ok()).toBeTruthy();
  const reviewed = (await reviewRes.json()) as {
    status?: string;
    receiptNumber?: string | null;
    orderStatus?: string;
  };
  expect(reviewed.status).toBe("VERIFIED");
  expect(reviewed.orderStatus).toBe("ACTIVE");
  expect(reviewed.receiptNumber).toBeTruthy();
});
