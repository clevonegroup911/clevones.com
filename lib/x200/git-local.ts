import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { GitSnapshot, SourceStatus } from "@/lib/x200/types";

const execFileAsync = promisify(execFile);

/** Fixed allowlist only — never accept caller-supplied argv/shell. */
const ALLOWED_GIT: Record<string, readonly string[]> = {
  head: ["rev-parse", "HEAD"],
  branch: ["branch", "--show-current"],
  porcelain: ["status", "--porcelain"],
  log: ["log", "-8", "--pretty=format:%H%x09%cI%x09%s"],
};

async function runFixedGit(
  key: keyof typeof ALLOWED_GIT,
): Promise<{ ok: true; stdout: string } | { ok: false; error: string }> {
  const args = ALLOWED_GIT[key];
  try {
    const { stdout } = await execFileAsync("git", [...args], {
      cwd: process.cwd(),
      timeout: 8_000,
      maxBuffer: 256 * 1024,
      env: {
        ...process.env,
        GIT_DIR: undefined,
        GIT_WORK_TREE: undefined,
      },
    });
    return { ok: true, stdout: stdout.trimEnd() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "git command failed",
    };
  }
}

export async function readGitSnapshot(): Promise<GitSnapshot> {
  const [headRes, branchRes, statusRes, logRes] = await Promise.all([
    runFixedGit("head"),
    runFixedGit("branch"),
    runFixedGit("porcelain"),
    runFixedGit("log"),
  ]);

  const warnings: string[] = [];
  let status: SourceStatus = "OK";

  const head = headRes.ok ? headRes.stdout.trim() || null : null;
  if (!headRes.ok) {
    status = "ERROR";
    warnings.push(`git HEAD: ${headRes.error}`);
  }

  const branch = branchRes.ok ? branchRes.stdout.trim() || null : null;
  if (!branchRes.ok) {
    status = status === "OK" ? "ERROR" : status;
    warnings.push(`git branch: ${branchRes.error}`);
  }

  let dirty: boolean | null = null;
  let dirtyFileCount: number | null = null;
  if (statusRes.ok) {
    const lines = statusRes.stdout
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean);
    dirty = lines.length > 0;
    dirtyFileCount = lines.length;
  } else {
    status = status === "OK" ? "ERROR" : status;
    warnings.push(`git status: ${statusRes.error}`);
  }

  const recentCommits: GitSnapshot["recentCommits"] = [];
  if (logRes.ok && logRes.stdout.trim()) {
    for (const line of logRes.stdout.split("\n")) {
      if (!line.trim()) continue;
      const [sha, at, ...rest] = line.split("\t");
      if (!sha) continue;
      recentCommits.push({
        sha: sha.slice(0, 40),
        at: at || null,
        subject: rest.join("\t").slice(0, 200) || "(no subject)",
      });
    }
  } else if (!logRes.ok) {
    status = status === "OK" ? "ERROR" : status;
    warnings.push(`git log: ${logRes.error}`);
  }

  if (!head && !branch && dirty === null) {
    status = "UNKNOWN";
  }

  return {
    head,
    branch,
    dirty,
    dirtyFileCount,
    recentCommits,
    status,
    warning: warnings.length ? warnings.join("; ") : null,
  };
}
