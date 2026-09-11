import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import {
  formatScanResult,
  isForbiddenTrackedPath,
  runSecretScan,
  scanText,
} from "./scan-secrets.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

test("repository scan reports no production secrets in git", () => {
  const result = runSecretScan({ cwd: ROOT });
  assert.equal(result.envTracked, false);
  assert.equal(result.forbidden.length, 0);
  assert.equal(result.blocking.length, 0, formatScanResult(result));
  assert.equal(result.ok, true);
});

test("scan reports pattern, file and line without the matched text", () => {
  const user = ["scan", "user"].join("");
  const pass = ["scan", "pass"].join("");
  const content = ["DATABASE_URL=", "postgresql://", user, ":", pass, "@127.0.0.1:1/db"].join("");
  const hits = scanText("lib/leak.ts", content);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].pattern, "postgresql_url");
  assert.equal(hits[0].file, "lib/leak.ts");
  assert.equal(hits[0].line, 1);
  assert.equal(hits[0].fixture, false);
  const rendered = formatScanResult({
    ok: false,
    envTracked: false,
    forbidden: [],
    fixtures: [],
    blocking: hits,
  });
  assert.match(rendered, /SCAN_SECRETS_FAIL/);
  assert.match(rendered, /pattern=postgresql_url file=lib\/leak\.ts line=1/);
  assert.doesNotMatch(rendered, /postgresql:\/\//);
  assert.doesNotMatch(rendered, new RegExp(user));
  assert.doesNotMatch(rendered, new RegExp(pass));
});

test("fixture files are classified, not blocking", () => {
  const assignment = ["AUTH_SECRET", "=", "x".repeat(32)].join("");
  const hits = scanText(".env.example", assignment);
  assert.ok(hits.length >= 1);
  assert.equal(hits.every((hit) => hit.fixture), true);
});

test("tracked .env path is forbidden", () => {
  assert.equal(isForbiddenTrackedPath(".env"), true);
  assert.equal(isForbiddenTrackedPath(".env.example"), false);
});

test("CLI exits 0 on the repository and does not print assignment values", () => {
  const run = spawnSync(process.execPath, ["scripts/scan-secrets.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /SCAN_SECRETS_OK/);
  assert.doesNotMatch(run.stdout, /AUTH_SECRET=/);
  assert.doesNotMatch(run.stdout, /MFA_ENCRYPTION_KEY=/);
});

test("temporary file scan stays local to constructed input", () => {
  const dir = mkdtempSync(join(tmpdir(), "t010-scan-"));
  const payload = ["-----BEGIN PRIVATE KEY-----"].join("");
  writeFileSync(join(dir, "probe.txt"), `${payload}\n`);
  const hits = scanText("probe.txt", `${payload}\n`);
  assert.equal(hits[0].pattern, "private_key_block");
  const rendered = formatScanResult({
    ok: false,
    envTracked: false,
    forbidden: [],
    fixtures: [],
    blocking: hits,
  });
  assert.doesNotMatch(rendered, /BEGIN PRIVATE KEY/);
});
