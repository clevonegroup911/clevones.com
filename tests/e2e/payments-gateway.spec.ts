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

type PostJsonResult = {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
};

/** Browser-context JSON POST — keeps cookies and always sends a complete body. */
async function postJsonOnce(
  page: import("@playwright/test").Page,
  path: string,
  payload: Record<string, unknown>,
): Promise<PostJsonResult> {
  return page.evaluate(
    async ({ path: url, payload: body }) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let json: unknown = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = { parseError: true, text };
        }
      }
      return { ok: response.ok, status: response.status, json, text };
    },
    { path, payload },
  );
}

function isTransientDevRouteError(result: PostJsonResult): boolean {
  if (result.ok || result.status !== 500) return false;
  return (
    result.text.includes("Unexpected end of JSON input") ||
    result.text.includes("loadManifest") ||
    result.text.includes("/_error")
  );
}

/** Retries brief Next.js dev-route compile races without masking real 4xx/5xx app errors. */
async function postJson(
  page: import("@playwright/test").Page,
  path: string,
  payload: Record<string, unknown>,
  attempts = 5,
): Promise<PostJsonResult> {
  let last: PostJsonResult | null = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await postJsonOnce(page, path, payload);
    if (last.ok || !isTransientDevRouteError(last) || i === attempts - 1) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
  }
  return last as PostJsonResult;
}

test("payments gateway sandbox: seed → proof PENDING → CLEVONE reconcile → VERIFIED receipt", async ({
  page,
}, testInfo) => {
  skipWithoutDb();
  const project = testInfo.project.name;
  const unique = `${project}-${Date.now().toString(36)}-${testInfo.retry}`;
  const reference = `E2E-PAY-${unique}`;
  const orderTitle = `E2E gateway ${unique}`;

  await loginE2eAdmin(page);

  await page.goto("/admin/payments");
  await expect(page.getByRole("heading", { name: "Paiements gateway" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /File HUMAN_REVIEW/ }),
  ).toBeVisible();
  const htmlAdmin = await page.content();
  expect(htmlAdmin).not.toMatch(/sk_live|pk_live|whsec_|MPESA_CONSUMER/i);
  await captureSafeEvidence(page, `${project}-payments-admin.png`);

  const seed = await postJson(page, "/api/admin/payments/sandbox", {
    title: orderTitle,
    amountCents: 3400,
    currency: "USD",
    settle: false,
  });
  expect(seed.ok, `sandbox status=${seed.status} body=${seed.text}`).toBeTruthy();
  const seeded = seed.json as {
    orderId: string;
    paymentId: string;
    invoiceId: string;
  };
  expect(seeded.paymentId).toBeTruthy();

  await page.goto("/portal/payments");
  await expect(page.getByRole("heading", { name: "Mes paiements" })).toBeVisible();
  await expect(page.getByText(orderTitle, { exact: false }).first()).toBeVisible();

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

  const eventRes = await postJson(page, "/api/admin/payments/clevone-event", {
    paymentId: seeded.paymentId,
    invoiceId: seeded.invoiceId,
    reference,
    amountCents: 3400,
    currency: "USD",
    source: "CLEVONE_SANDBOX",
  });
  expect(
    eventRes.ok,
    `clevone-event status=${eventRes.status} body=${eventRes.text}`,
  ).toBeTruthy();
  const eventBody = eventRes.json as { authenticated?: boolean };
  expect(eventBody.authenticated).toBe(true);

  const reconcileRes = await postJson(page, "/api/admin/payments/reconcile", {
    paymentId: seeded.paymentId,
    invoiceId: seeded.invoiceId,
  });
  expect(
    reconcileRes.ok,
    `reconcile status=${reconcileRes.status} body=${reconcileRes.text}`,
  ).toBeTruthy();
  const reconciled = reconcileRes.json as {
    status?: string;
    allowsCapture?: boolean;
  };
  expect(reconciled.status).toBe("VERIFIED");
  expect(reconciled.allowsCapture).toBe(true);

  const activateRes = await postJson(page, "/api/admin/payments/activate", {
    paymentId: seeded.paymentId,
  });
  expect(
    activateRes.ok,
    `activate status=${activateRes.status} body=${activateRes.text}`,
  ).toBeTruthy();
  const activated = activateRes.json as {
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
  const unique = `${project}-${Date.now().toString(36)}-${testInfo.retry}`;

  await loginE2eAdmin(page);

  const seed = await postJson(page, "/api/admin/payments/sandbox", {
    title: `E2E review ${unique}`,
    amountCents: 2100,
    currency: "USD",
    settle: false,
  });
  expect(seed.ok, `sandbox status=${seed.status} body=${seed.text}`).toBeTruthy();
  const seeded = seed.json as {
    paymentId: string;
    invoiceId: string;
  };

  await postJson(page, "/api/admin/payments/clevone-event", {
    paymentId: seeded.paymentId,
    invoiceId: seeded.invoiceId,
    reference: `E2E-MIS-${unique}`,
    amountCents: 9999,
    currency: "USD",
    source: "CLEVONE_SANDBOX",
  });

  const reconcileRes = await postJson(page, "/api/admin/payments/reconcile", {
    paymentId: seeded.paymentId,
    invoiceId: seeded.invoiceId,
  });
  expect(
    reconcileRes.ok,
    `reconcile status=${reconcileRes.status} body=${reconcileRes.text}`,
  ).toBeTruthy();
  const reconciled = reconcileRes.json as {
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

  const reviewRes = await postJson(page, "/api/admin/payments/review", {
    decisionId: reconciled.decisionId,
    action: "approve",
  });
  expect(
    reviewRes.ok,
    `review status=${reviewRes.status} body=${reviewRes.text}`,
  ).toBeTruthy();
  const reviewed = reviewRes.json as {
    status?: string;
    receiptNumber?: string | null;
    orderStatus?: string;
  };
  expect(reviewed.status).toBe("VERIFIED");
  expect(reviewed.orderStatus).toBe("ACTIVE");
  expect(reviewed.receiptNumber).toBeTruthy();
});
