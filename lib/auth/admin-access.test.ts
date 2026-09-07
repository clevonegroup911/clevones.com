import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAccessAdminConsole,
  getAdminAccessDenialReason,
} from "@/lib/auth/admin-access";

test("an active admin with MFA enabled can access the console after login", () => {
  const user = {
    role: "SUPER_ADMIN" as const,
    status: "ACTIVE" as const,
    mfaEnabled: true,
  };

  assert.equal(canAccessAdminConsole(user), true);
  assert.equal(getAdminAccessDenialReason(user), null);
});

test("inactive or non-admin users remain denied", () => {
  assert.equal(
    canAccessAdminConsole({ role: "USER", status: "ACTIVE" }),
    false,
  );
  assert.equal(
    getAdminAccessDenialReason({ role: "ADMIN", status: "DISABLED" }),
    "disabled",
  );
});
