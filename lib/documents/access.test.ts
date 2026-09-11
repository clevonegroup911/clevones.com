import assert from "node:assert/strict";
import { test } from "node:test";

import { canAccessDocument, documentListFilterForActor } from "./access";

const baseDoc = {
  ownerId: "owner-1",
  accessLevel: "PRIVATE" as const,
  deletedAt: null,
};

test("SUPER_ADMIN can access any document including strangers' PRIVATE", () => {
  const actor = { id: "sa", role: "SUPER_ADMIN" as const };
  assert.equal(canAccessDocument(actor, baseDoc, "read").allowed, true);
  assert.equal(canAccessDocument(actor, baseDoc, "delete").allowed, true);
  assert.equal(documentListFilterForActor(actor).mode, "all");
});

test("ADMIN is denied another user's PRIVATE document without grant", () => {
  const actor = { id: "admin-2", role: "ADMIN" as const };
  const decision = canAccessDocument(actor, baseDoc, "read");
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "admin_scope_denied");
});

test("ADMIN can read own PRIVATE and INTERNAL documents", () => {
  const actor = { id: "owner-1", role: "ADMIN" as const };
  assert.equal(canAccessDocument(actor, baseDoc, "read").allowed, true);
  assert.equal(
    canAccessDocument(
      { id: "admin-2", role: "ADMIN" },
      { ...baseDoc, accessLevel: "INTERNAL" },
      "read",
    ).allowed,
    true,
  );
});

test("ADMIN with grant can read RESTRICTED of another owner", () => {
  const actor = { id: "admin-2", role: "ADMIN" as const };
  const doc = { ...baseDoc, accessLevel: "RESTRICTED" as const };
  assert.equal(canAccessDocument(actor, doc, "read").allowed, false);
  assert.equal(canAccessDocument(actor, doc, "read", { hasGrant: true }).allowed, true);
});

test("USER without grant cannot download another owner's document", () => {
  const actor = { id: "user-9", role: "USER" as const };
  const decision = canAccessDocument(actor, baseDoc, "read");
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "user_denied");
});

test("USER with grant can read but not delete another's document", () => {
  const actor = { id: "user-9", role: "USER" as const };
  assert.equal(canAccessDocument(actor, baseDoc, "read", { hasGrant: true }).allowed, true);
  assert.equal(canAccessDocument(actor, baseDoc, "delete", { hasGrant: true }).allowed, false);
});

test("deleted documents are not readable", () => {
  const actor = { id: "sa", role: "SUPER_ADMIN" as const };
  assert.equal(
    canAccessDocument(
      actor,
      { ...baseDoc, deletedAt: new Date() },
      "read",
    ).allowed,
    false,
  );
});
