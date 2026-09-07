import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { auditActions } from "@/lib/admin/audit";

const MFA_SOURCE_FILES = [
  "app/admin/login/mfa/actions.ts",
  "app/admin/security/mfa/actions.ts",
  "lib/admin/audit.ts",
  "lib/auth/mfa-consume.ts",
  "lib/auth/mfa-enrollment.ts",
  "lib/auth/mfa-challenge.ts",
];

const FORBIDDEN = /secretBase32|manualKey|recoveryCodes|ciphertext|authTag|codeHash|submittedCode/;

const PRODUCTION_SOURCE_FILES = [
  "app/admin/actions.ts",
  "app/admin/login/mfa/actions.ts",
  "app/admin/login/mfa/page.tsx",
  "app/admin/security/mfa/actions.ts",
  "app/admin/security/mfa/page.tsx",
  "lib/auth/mfa-challenge.ts",
  "lib/auth/mfa-consume.ts",
  "lib/auth/mfa-enrollment.ts",
  "lib/auth/mfa-rate-limit.ts",
  "middleware.ts",
];

const CLIENT_SOURCE_FILES = [
  "app/admin/login/mfa/mfa-verify-form.tsx",
  "app/admin/security/mfa/mfa-settings-panel.tsx",
];

test("MFA audit metadata never includes secrets, TOTP codes, or recovery codes", () => {
  assert.equal(auditActions.MFA_LOGIN_SUCCESS, "MFA_LOGIN_SUCCESS");

  for (const relativePath of MFA_SOURCE_FILES) {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    assert.doesNotMatch(
      source,
      /console\.(log|info|debug|error|warn)\(/,
      `${relativePath} must not log MFA material`,
    );

    const metadataBlocks = source.match(/metadata:\s*\{[\s\S]*?\}/g) ?? [];
    for (const block of metadataBlocks) {
      assert.doesNotMatch(
        block,
        FORBIDDEN,
        `${relativePath} audit metadata must not include secrets or codes: ${block}`,
      );
    }
  }

  const verifySource = readFileSync(
    join(process.cwd(), "app/admin/login/mfa/actions.ts"),
    "utf8",
  );
  assert.match(verifySource, /method:\s*usedRecoveryCodeId \? "recovery" : "totp"/);
  assert.match(verifySource, /metadata:\s*\{\s*reason\s*\}/);
});

test("production MFA modules never import the in-memory test helper", () => {
  for (const relativePath of PRODUCTION_SOURCE_FILES) {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    assert.doesNotMatch(
      source,
      /mfa-memory-db/,
      `${relativePath} must not import the in-memory MFA test helper`,
    );
  }
});

test("client MFA components do not import crypto, Prisma, or secret helpers", () => {
  for (const relativePath of CLIENT_SOURCE_FILES) {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    assert.doesNotMatch(
      source,
      /mfa-crypto|mfa-config|mfa-consume|mfa-enrollment|mfa-recovery|mfa-totp|mfa-rate-limit|@prisma\/client|lib\/db\/prisma/,
      `${relativePath} must not import server MFA internals`,
    );
  }
});
