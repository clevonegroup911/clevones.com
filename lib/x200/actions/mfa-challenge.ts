import "server-only";

import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { appendFile, chmod, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { redactMonitoringText } from "@/lib/x200/activity";

const CHALLENGE_REL = path.join(".x200", "privileged-challenges.jsonl");
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export type PrivilegedChallenge = {
  challengeId: string;
  actorId: string;
  action: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  /** SHA-256 of verified token — never store raw MFA code. */
  proofHash: string;
};

function hashProof(proof: string): string {
  return createHash("sha256").update(`x200-priv:${proof}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Issue a short-lived privileged action challenge after MFA/password verified
 * by the caller. Stores only a hash of the proof token.
 */
export async function issuePrivilegedChallenge(input: {
  actorId: string;
  action: string;
  /** Opaque proof string from successful MFA verification (not the TOTP itself). */
  mfaProofToken: string;
  ttlMs?: number;
  nowMs?: number;
  cwd?: string;
}): Promise<{ challengeId: string; expiresAt: string }> {
  const now = input.nowMs ?? Date.now();
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS;
  const record: PrivilegedChallenge = {
    challengeId: randomUUID(),
    actorId: input.actorId,
    action: input.action,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
    consumedAt: null,
    proofHash: hashProof(input.mfaProofToken),
  };
  await appendChallenge(record, input.cwd);
  return { challengeId: record.challengeId, expiresAt: record.expiresAt };
}

export async function consumePrivilegedChallenge(input: {
  challengeId: string;
  actorId: string;
  action: string;
  mfaProofToken: string;
  nowMs?: number;
  cwd?: string;
}): Promise<
  | { ok: true }
  | { ok: false; code: "CHALLENGE_INVALID" | "CHALLENGE_EXPIRED" | "CHALLENGE_CONSUMED" }
> {
  const all = await readChallenges(input.cwd);
  const found = all.find((c) => c.challengeId === input.challengeId);
  if (
    !found ||
    found.actorId !== input.actorId ||
    found.action !== input.action ||
    !safeEqualHex(found.proofHash, hashProof(input.mfaProofToken))
  ) {
    return { ok: false, code: "CHALLENGE_INVALID" };
  }
  if (found.consumedAt) return { ok: false, code: "CHALLENGE_CONSUMED" };
  const now = input.nowMs ?? Date.now();
  if (Date.parse(found.expiresAt) <= now) {
    return { ok: false, code: "CHALLENGE_EXPIRED" };
  }
  const consumed: PrivilegedChallenge = {
    ...found,
    consumedAt: new Date(now).toISOString(),
  };
  await appendChallenge(consumed, input.cwd);
  return { ok: true };
}

/**
 * Dev/test helper: accept a well-formed mock MFA proof when
 * X200_PRIVILEGED_MFA_MOCK=true (never in production).
 */
export function acceptMockMfaProof(
  code: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.X200_PRIVILEGED_MFA_MOCK !== "true") return false;
  return /^\d{6}$/.test(code) || code === "MOCK-MFA-OK";
}

async function appendChallenge(
  record: PrivilegedChallenge,
  cwd = process.cwd(),
): Promise<void> {
  await mkdir(path.join(cwd, ".x200"), { recursive: true, mode: 0o700 });
  const filePath = path.join(cwd, CHALLENGE_REL);
  // Never persist raw MFA codes — proofHash only.
  const safe = {
    ...record,
    actorId: redactMonitoringText(record.actorId, 80),
  };
  await appendFile(filePath, `${JSON.stringify(safe)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort
  }
}

async function readChallenges(cwd = process.cwd()): Promise<PrivilegedChallenge[]> {
  const filePath = path.join(cwd, CHALLENGE_REL);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }
  const out: PrivilegedChallenge[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as PrivilegedChallenge);
    } catch {
      // skip
    }
  }
  return out;
}
