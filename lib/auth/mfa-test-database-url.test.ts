import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DisallowedMfaTestDatabaseUrlError,
  resolveMfaTestDatabaseUrl,
} from "@/lib/auth/integration/mfa-test-database-url";

test("MFA PostgreSQL tests ignore DATABASE_URL and require a dedicated test URL", () => {
  const env = {
    DATABASE_URL: "postgresql://USER:PASSWORD@localhost:5432/clevones?schema=public",
  };
  assert.equal(resolveMfaTestDatabaseUrl(env), null);
});

test("MFA PostgreSQL tests accept a loopback ephemeral database URL", () => {
  const env = {
    TEST_DATABASE_URL: "postgresql://t002mfa:secret@127.0.0.1:55432/t002mfa",
    DATABASE_URL: "postgresql://USER:PASSWORD@db.example.com:5432/clevones",
  };
  assert.equal(resolveMfaTestDatabaseUrl(env), env.TEST_DATABASE_URL);
});

test("MFA PostgreSQL tests refuse remote or production-looking database URLs", () => {
  const env = {
    TEST_DATABASE_URL: "postgresql://USER:PASSWORD@db.example.com:5432/clevones",
  };
  assert.throws(
    () => resolveMfaTestDatabaseUrl(env),
    DisallowedMfaTestDatabaseUrlError,
  );

  assert.throws(
    () =>
      resolveMfaTestDatabaseUrl({
        TEST_DATABASE_URL: "postgresql://USER:PASSWORD@localhost:5432/clevones",
      }),
    DisallowedMfaTestDatabaseUrlError,
  );
});
