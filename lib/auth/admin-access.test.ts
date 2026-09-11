import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAccessAdminConsole,
  getAdminAccessDenialReason,
  isAdminRole,
  toAdminActor,
} from "@/lib/auth/admin-access";

test("an active SUPER_ADMIN can access the console after login", () => {
  const user = {
    role: "SUPER_ADMIN" as const,
    status: "ACTIVE" as const,
    mfaEnabled: true,
  };

  assert.equal(isAdminRole(user.role), true);
  assert.equal(canAccessAdminConsole(user), true);
  assert.equal(getAdminAccessDenialReason(user), null);
});

test("an active ADMIN can access the console without MFA enrollment", () => {
  const user = {
    role: "ADMIN" as const,
    status: "ACTIVE" as const,
  };

  assert.equal(isAdminRole(user.role), true);
  assert.equal(canAccessAdminConsole(user), true);
  assert.equal(getAdminAccessDenialReason(user), null);
});

test("USER never receives admin console access", () => {
  assert.equal(isAdminRole("USER"), false);
  assert.equal(canAccessAdminConsole({ role: "USER", status: "ACTIVE" }), false);
  assert.equal(
    getAdminAccessDenialReason({ role: "USER", status: "ACTIVE" }),
    "insufficient_role",
  );
  assert.equal(
    getAdminAccessDenialReason({ role: "USER", status: "DISABLED" }),
    "insufficient_role",
  );
});

test("inactive or pending admins remain denied", () => {
  assert.equal(
    canAccessAdminConsole({ role: "ADMIN", status: "DISABLED" }),
    false,
  );
  assert.equal(
    getAdminAccessDenialReason({ role: "ADMIN", status: "DISABLED" }),
    "disabled",
  );
  assert.equal(
    getAdminAccessDenialReason({ role: "SUPER_ADMIN", status: "PENDING" }),
    "pending",
  );
  assert.equal(
    canAccessAdminConsole({ role: "SUPER_ADMIN", status: "PENDING" }),
    false,
  );
});

test("toAdminActor maps admin roles and rejects USER", () => {
  const admin = {
    id: "admin-1",
    email: "admin@example.test",
    firstName: "Ada",
    lastName: "Admin",
    role: "ADMIN" as const,
    mfaEnabled: false,
  };
  const user = { ...admin, id: "user-1", role: "USER" as const };

  assert.deepEqual(toAdminActor(admin), {
    id: "admin-1",
    email: "admin@example.test",
    firstName: "Ada",
    lastName: "Admin",
    role: "ADMIN",
    mfaEnabled: false,
  });
  assert.equal(toAdminActor(user), null);
});
