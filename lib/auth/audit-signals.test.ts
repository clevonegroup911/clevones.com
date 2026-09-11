import assert from "node:assert/strict";
import { test } from "node:test";

import {
  auditActions,
  countAuthAuditSignals,
  CRITICAL_AUTH_AUDIT_ACTIONS,
  isCriticalAuthAuditAction,
} from "@/lib/admin/audit";

test("critical auth audit signals cover login and MFA failures without secrets", () => {
  assert.deepEqual(CRITICAL_AUTH_AUDIT_ACTIONS, [
    auditActions.AUTH_LOGIN_FAILURE,
    auditActions.MFA_LOGIN_FAILED,
  ]);
  assert.equal(isCriticalAuthAuditAction(auditActions.AUTH_LOGIN_FAILURE), true);
  assert.equal(isCriticalAuthAuditAction(auditActions.MFA_LOGIN_FAILED), true);
  assert.equal(isCriticalAuthAuditAction(auditActions.MFA_LOGIN_SUCCESS), false);
  assert.equal(isCriticalAuthAuditAction(auditActions.ADMIN_LOGOUT), false);

  const counts = countAuthAuditSignals([
    auditActions.AUTH_LOGIN_FAILURE,
    auditActions.AUTH_LOGIN_FAILURE,
    auditActions.MFA_LOGIN_FAILED,
    auditActions.MFA_LOGIN_SUCCESS,
    auditActions.MFA_RECOVERY_CODE_USED,
    auditActions.AUTH_LOGIN_SUCCESS,
    "UNKNOWN",
  ]);

  assert.deepEqual(counts, {
    loginFailures: 2,
    mfaFailures: 1,
    mfaSuccesses: 1,
    recoveryUsed: 1,
    loginSuccesses: 1,
  });
});
