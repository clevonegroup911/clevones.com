import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAccessPortal,
  canSignInAsPortalUser,
  getPortalAccessDenialReason,
  getPortalSignInDenialReason,
  toPortalActor,
} from "@/lib/auth/portal-access";

test("ACTIVE USER can sign in and access the portal", () => {
  const user = { role: "USER" as const, status: "ACTIVE" as const };
  assert.equal(canSignInAsPortalUser(user), true);
  assert.equal(canAccessPortal(user), true);
  assert.equal(getPortalSignInDenialReason(user), null);
  assert.equal(getPortalAccessDenialReason(user), null);
});

test("ADMIN and SUPER_ADMIN cannot use portal sign-in credentials path", () => {
  assert.equal(
    canSignInAsPortalUser({ role: "ADMIN", status: "ACTIVE" }),
    false,
  );
  assert.equal(
    canSignInAsPortalUser({ role: "SUPER_ADMIN", status: "ACTIVE" }),
    false,
  );
  assert.equal(
    getPortalSignInDenialReason({ role: "ADMIN", status: "ACTIVE" }),
    "insufficient_role",
  );
  // Admins may still reach portal via admin_session + requirePortalActor.
  assert.equal(canAccessPortal({ role: "ADMIN", status: "ACTIVE" }), true);
});

test("inactive USER is denied portal sign-in", () => {
  assert.equal(
    canSignInAsPortalUser({ role: "USER", status: "DISABLED" }),
    false,
  );
  assert.equal(
    getPortalSignInDenialReason({ role: "USER", status: "PENDING" }),
    "pending",
  );
  assert.equal(
    getPortalAccessDenialReason({ role: "USER", status: "DISABLED" }),
    "disabled",
  );
});

test("toPortalActor maps USER fields", () => {
  assert.deepEqual(
    toPortalActor({
      id: "user-1",
      email: "user@example.test",
      firstName: "Pat",
      lastName: "Client",
      role: "USER",
    }),
    {
      id: "user-1",
      email: "user@example.test",
      firstName: "Pat",
      lastName: "Client",
      role: "USER",
    },
  );
});
