#!/usr/bin/env node
import { spawnSync } from "node:child_process";

import { isCliEntry } from "./lib/x100-fs.mjs";

export const AUDIT_ALLOWLIST = Object.freeze(["GHSA-GGR8-5VV4-36MX"]);

const BLOCKING_SEVERITIES = new Set(["high", "critical"]);

function extractGhsaIds(entry) {
  const ids = new Set();
  const via = Array.isArray(entry?.via) ? entry.via : [];
  for (const item of via) {
    if (typeof item === "string") {
      const match = /GHSA-[0-9a-z-]+/i.exec(item);
      if (match) {
        ids.add(match[0].toUpperCase());
      }
      continue;
    }
    const url = String(item?.url || "");
    const match = /GHSA-[0-9a-z-]+/i.exec(url);
    if (match) {
      ids.add(match[0].toUpperCase());
    }
  }
  return [...ids];
}

function resolveGhsaIds(name, vulnerabilities, seen = new Set()) {
  if (seen.has(name)) {
    return [];
  }
  seen.add(name);
  const entry = vulnerabilities[name];
  if (!entry) {
    return [];
  }

  const ids = new Set(extractGhsaIds(entry));
  const via = Array.isArray(entry.via) ? entry.via : [];
  for (const item of via) {
    if (typeof item === "string") {
      for (const nested of resolveGhsaIds(item, vulnerabilities, seen)) {
        ids.add(nested);
      }
    }
  }
  return [...ids];
}

export function evaluateAuditReport(report) {
  const vulnerabilities = report?.vulnerabilities || {};
  const blocking = [];
  const allowed = [];

  for (const [name, entry] of Object.entries(vulnerabilities)) {
    const severity = String(entry?.severity || "").toLowerCase();
    if (!BLOCKING_SEVERITIES.has(severity)) {
      continue;
    }
    const ghsas = resolveGhsaIds(name, vulnerabilities);
    const remaining = ghsas.filter((id) => !AUDIT_ALLOWLIST.includes(id));
    if (ghsas.length > 0 && remaining.length === 0) {
      allowed.push({ name, severity, ghsas });
    } else {
      blocking.push({ name, severity, ghsas: remaining });
    }
  }

  return {
    ok: blocking.length === 0,
    blocking,
    allowed,
  };
}

export function parseAuditStdout(stdout) {
  const text = String(stdout || "").trim();
  if (!text) {
    throw new Error("npm audit n'a produit aucun JSON");
  }
  return JSON.parse(text);
}

async function main() {
  const run = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
    encoding: "utf8",
    env: process.env,
    shell: false,
  });

  let report;
  try {
    report = parseAuditStdout(run.stdout);
  } catch (error) {
    process.stderr.write(
      `AUDIT_INVALID ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }

  const result = evaluateAuditReport(report);
  process.stdout.write(
    `AUDIT ${result.ok ? "PASS" : "FAIL"} allowlist=${AUDIT_ALLOWLIST.join(",")}\n`,
  );
  for (const item of result.allowed) {
    process.stdout.write(
      `allowed ${item.name} ${item.severity} ${item.ghsas.join(",")}\n`,
    );
  }
  for (const item of result.blocking) {
    process.stderr.write(
      `blocking ${item.name} ${item.severity} ${item.ghsas.join(",") || "unidentified"}\n`,
    );
  }
  return result.ok ? 0 : 1;
}

if (isCliEntry(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exit(1);
    },
  );
}
