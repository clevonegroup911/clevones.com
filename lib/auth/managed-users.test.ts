import assert from "node:assert/strict";
import { test } from "node:test";

import { createManagedUserSchema } from "@/lib/auth/managed-users";

test("createManagedUserSchema accepts USER and ADMIN only", () => {
  const base = {
    email: "client@example.test",
    firstName: "Pat",
    lastName: "Client",
    password: "StrongPass!word99",
  };

  assert.equal(
    createManagedUserSchema.safeParse({ ...base, role: "USER" }).success,
    true,
  );
  assert.equal(
    createManagedUserSchema.safeParse({ ...base, role: "ADMIN" }).success,
    true,
  );
  assert.equal(
    createManagedUserSchema.safeParse({ ...base, role: "SUPER_ADMIN" }).success,
    false,
  );
});

test("createManagedUserSchema rejects weak passwords", () => {
  const parsed = createManagedUserSchema.safeParse({
    email: "client@example.test",
    firstName: "Pat",
    lastName: "Client",
    password: "short",
    role: "USER",
  });
  assert.equal(parsed.success, false);
});
