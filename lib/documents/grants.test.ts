import assert from "node:assert/strict";
import { test } from "node:test";

import { DocumentGrantError } from "@/lib/documents/grants";
import { canAccessDocument } from "@/lib/documents/access";

test("DocumentGrantError exposes stable codes", () => {
  const error = new DocumentGrantError("missing", "GRANT_NOT_FOUND");
  assert.equal(error.code, "GRANT_NOT_FOUND");
  assert.equal(error.name, "DocumentGrantError");
});

test("USER with grant can read but without grant is denied (ACL ready for T034)", () => {
  const doc = {
    ownerId: "owner-1",
    accessLevel: "RESTRICTED" as const,
    deletedAt: null,
  };
  const actor = { id: "user-2", role: "USER" as const };

  assert.equal(
    canAccessDocument(actor, doc, "read", { hasGrant: false }).allowed,
    false,
  );
  assert.equal(
    canAccessDocument(actor, doc, "read", { hasGrant: true }).allowed,
    true,
  );
});
