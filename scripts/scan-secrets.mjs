#!/usr/bin/env node
/**
 * Scan git-tracked files for secret-like VALUES.
 * Never prints matched text — only pattern id, relative path, and line number.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { isCliEntry } from "./lib/x100-fs.mjs";

export const SKIP_PATH = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|pdf|lock)$/i;

export const FORBIDDEN_TRACKED_PATHS = [
  /^\.env$/,
  /^\.env\.(?!example(?:$|\.))/,
  /\.pem$/i,
  /\.p12$/i,
  /(^|\/)id_rsa$/,
  /(^|\/)credentials\.json$/i,
  /service-account.*\.json$/i,
];

export const PATTERNS = Object.freeze([
  { id: "postgresql_url", re: /postgresql:\/\/[^\s"'`]+/gi },
  { id: "postgres_url", re: /postgres:\/\/[^\s"'`]+/gi },
  { id: "private_key_block", re: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g },
  { id: "github_pat", re: /github_pat_[A-Za-z0-9_]{20,}/g },
  { id: "github_token", re: /gh[pousr]_[A-Za-z0-9]{20,}/g },
  { id: "aws_access_key", re: /AKIA[0-9A-Z]{16}/g },
  { id: "auth_secret_assignment", re: /(?:^|[^A-Z_])AUTH_SECRET\s*[=:]\s*["']?[^\s"'`#]{16,}/gm },
  { id: "mfa_key_assignment", re: /(?:^|[^A-Z_])MFA_ENCRYPTION_KEY\s*[=:]\s*["']?[^\s"'`#]{16,}/gm },
]);

const FIXTURE_FILES = new Set([
  ".env.example",
  ".github/workflows/ci.yml",
  "scripts/scan-secrets.mjs",
]);

export function isFixturePath(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (FIXTURE_FILES.has(normalized)) {
    return true;
  }
  if (normalized.startsWith("tests/")) {
    return true;
  }
  if (normalized.startsWith("scripts/") && normalized.endsWith(".test.mjs")) {
    return true;
  }
  if (normalized.includes(".test.")) {
    return true;
  }
  return false;
}

export function isForbiddenTrackedPath(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  return FORBIDDEN_TRACKED_PATHS.some((pattern) => pattern.test(normalized));
}

export function scanText(relativePath, content) {
  const hits = [];
  if (typeof content !== "string" || content.includes("\0")) {
    return hits;
  }
  for (const pattern of PATTERNS) {
    pattern.re.lastIndex = 0;
    let match = pattern.re.exec(content);
    while (match) {
      const prefix = content.slice(0, match.index);
      const line = prefix.split("\n").length;
      hits.push({
        pattern: pattern.id,
        file: relativePath.replaceAll("\\", "/"),
        line,
        fixture: isFixturePath(relativePath),
      });
      match = pattern.re.exec(content);
    }
  }
  return hits;
}

function gitTrackedFiles(cwd) {
  const run = spawnSync("git", ["ls-files", "-z"], { cwd, encoding: "buffer" });
  if (run.status !== 0) {
    throw new Error("git ls-files failed");
  }
  const raw = run.stdout.toString("utf8");
  return raw.split("\0").filter(Boolean);
}

export function runSecretScan({ cwd = process.cwd() } = {}) {
  const files = gitTrackedFiles(cwd);
  const forbidden = files.filter((file) => isForbiddenTrackedPath(file));
  const blocking = [];
  const fixtures = [];

  for (const file of files) {
    if (SKIP_PATH.test(file) || isForbiddenTrackedPath(file)) {
      continue;
    }
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const hits = scanText(file, content);
    for (const hit of hits) {
      if (hit.fixture) {
        fixtures.push(hit);
      } else {
        blocking.push(hit);
      }
    }
  }

  const envTracked = files.includes(".env");
  const ok = forbidden.length === 0 && blocking.length === 0 && !envTracked;
  return {
    ok,
    envTracked,
    forbidden,
    fixtures,
    blocking,
  };
}

function formatHits(label, hits) {
  return hits.map((hit) => `${label} pattern=${hit.pattern} file=${hit.file} line=${hit.line}`);
}

export function formatScanResult(result) {
  const lines = [
    result.ok ? "SCAN_SECRETS_OK" : "SCAN_SECRETS_FAIL",
    `tracked_env: ${result.envTracked ? "yes" : "no"}`,
    `forbidden_paths: ${result.forbidden.length}`,
    `fixture_hits: ${result.fixtures.length}`,
    `blocking_hits: ${result.blocking.length}`,
    ...result.forbidden.map((file) => `FORBIDDEN file=${file}`),
    ...formatHits("HIT", result.blocking),
    ...formatHits("FIXTURE", result.fixtures),
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const result = runSecretScan();
  process.stdout.write(formatScanResult(result));
  return result.ok ? 0 : 1;
}

if (isCliEntry(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write("SCAN_SECRETS_FAIL\n");
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    },
  );
}
