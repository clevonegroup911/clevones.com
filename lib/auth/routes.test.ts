import assert from "node:assert/strict";
import { test } from "node:test";

import {
  adminRoutes,
  isAdminPath,
  isAdminProtectedPath,
  isAdminPublicPath,
  isProtectedPath,
  safeAdminCallbackUrl,
} from "@/lib/auth/routes";

test("admin login paths stay public while the console is protected", () => {
  assert.equal(isAdminPublicPath(adminRoutes.login), true);
  assert.equal(isAdminPublicPath(adminRoutes.mfaVerify), true);
  assert.equal(isAdminProtectedPath(adminRoutes.login), false);
  assert.equal(isAdminProtectedPath(adminRoutes.mfaVerify), false);

  assert.equal(isAdminProtectedPath(adminRoutes.root), true);
  assert.equal(isAdminProtectedPath(adminRoutes.dashboard), true);
  assert.equal(isAdminProtectedPath(adminRoutes.securityMfa), true);
  assert.equal(isAdminProtectedPath(adminRoutes.cms), true);
  assert.equal(isAdminPublicPath(adminRoutes.dashboard), false);
  assert.equal(isAdminPublicPath(adminRoutes.securityMfa), false);
  assert.equal(isAdminPublicPath(adminRoutes.cms), false);
});

test("non-admin paths are not classified as the admin console", () => {
  assert.equal(isAdminPath("/"), false);
  assert.equal(isAdminPath("/portal"), false);
  assert.equal(isAdminProtectedPath("/portal"), false);
  assert.equal(isProtectedPath("/portal"), true);
});

test("admin callback URLs reject open redirects and non-admin paths", () => {
  assert.equal(safeAdminCallbackUrl(null), adminRoutes.dashboard);
  assert.equal(
    safeAdminCallbackUrl("/admin/security/mfa"),
    "/admin/security/mfa",
  );
  assert.equal(safeAdminCallbackUrl("//evil.example"), adminRoutes.dashboard);
  assert.equal(
    safeAdminCallbackUrl("https://evil.example/admin"),
    adminRoutes.dashboard,
  );
  assert.equal(safeAdminCallbackUrl("/portal"), adminRoutes.dashboard);
  assert.equal(safeAdminCallbackUrl("/admin/login"), adminRoutes.dashboard);
});
