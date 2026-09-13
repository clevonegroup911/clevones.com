import assert from "node:assert/strict";
import { test } from "node:test";

import { GET } from "@/app/health/route";

test("GET /health returns 200 with minimal non-secret payload", async () => {
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");

  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(body.status, "ok");
  assert.equal(body.service, "clevones-com");
  assert.equal(Object.keys(body).sort().join(","), "service,status");

  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /AUTH_SECRET|MFA_ENCRYPTION_KEY|DATABASE_URL|sk_live|postgresql:/i);
});
