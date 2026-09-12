import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createPortalSessionToken,
  verifyPortalSessionToken,
} from "@/lib/auth/portal-session-token";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/auth/session-token";

const PREV_SECRET = process.env.AUTH_SECRET;

test("portal session JWT accepts USER and rejects admin audience tokens", async () => {
  process.env.AUTH_SECRET = "e2e-test-auth-secret-32chars-minimum!!";

  try {
    const token = await createPortalSessionToken({
      sub: "user-1",
      email: "user@example.test",
      role: "USER",
    });
    const claims = await verifyPortalSessionToken(token);
    assert.deepEqual(claims, {
      sub: "user-1",
      email: "user@example.test",
      role: "USER",
    });

    const adminToken = await createAdminSessionToken({
      sub: "admin-1",
      email: "admin@example.test",
      role: "ADMIN",
    });
    assert.equal(await verifyPortalSessionToken(adminToken), null);
    assert.equal(await verifyAdminSessionToken(token), null);
  } finally {
    if (PREV_SECRET === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = PREV_SECRET;
    }
  }
});
