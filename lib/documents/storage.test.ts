import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildStorageKey,
  putPrivateObject,
  readPrivateObject,
} from "./storage";

test("buildStorageKey keeps a safe file suffix", () => {
  const key = buildStorageKey("../../etc/passwd.pdf");
  assert.match(key, /passwd\.pdf$/);
  assert.doesNotMatch(key, /\.\.\//);
});

test("private storage writes outside public/", async () => {
  const root = mkdtempSync(join(tmpdir(), "clevones-docs-"));
  process.env.PRIVATE_DOCUMENT_ROOT = root;
  try {
    const stored = await putPrivateObject("unit/test.txt", Buffer.from("secret"));
    const read = await readPrivateObject(stored.key);
    assert.equal(read.toString("utf8"), "secret");
    assert.equal(stored.checksumSha256.length, 64);
    assert.ok(!stored.absolutePath.includes("/public/"));
  } finally {
    delete process.env.PRIVATE_DOCUMENT_ROOT;
    rmSync(root, { recursive: true, force: true });
  }
});
