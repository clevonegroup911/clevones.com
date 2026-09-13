import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GithubTransportSource =
  | "REST_AUTHENTICATED"
  | "GH_CLI_AUTHENTICATED"
  | "NOT_CONNECTED";

export type GithubGetResult =
  | { ok: true; json: unknown; source: Exclude<GithubTransportSource, "NOT_CONNECTED"> }
  | { ok: false; error: string; status: number | null; source: GithubTransportSource };

const USER_AGENT = "clevones-x200-github-transport/T047";
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function isValidGithubRepository(repository: string): boolean {
  return REPO_RE.test(repository) && !repository.includes("..");
}

export function isValidPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function optionalGithubToken(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const token =
    env.GITHUB_TOKEN?.trim() || env.GH_TOKEN?.trim() || null;
  return token && token.length > 0 ? token : null;
}

/** gh CLI fallback is local-only — never rely on it in production runtimes. */
export function isLocalGithubCliFallbackAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.X200_GITHUB_CLI_FALLBACK === "false") return false;
  if (env.X200_GITHUB_CLI_FALLBACK === "true") return true;
  if (env.NODE_ENV === "production") return false;
  if (env.VERCEL === "1") return false;
  return true;
}

function githubHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Convert a full api.github.com URL into a `gh api` path (+ optional query).
 * Reject anything outside /repos/... to keep argv fixed-shape.
 */
export function apiUrlToGhPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.host !== "api.github.com") {
    return null;
  }
  if (!parsed.pathname.startsWith("/repos/")) return null;
  const path = parsed.pathname.replace(/^\//, "");
  if (!/^repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/|$)/.test(path)) {
    return null;
  }
  return `${path}${parsed.search}`;
}

async function restGet(
  url: string,
  token: string | null,
  timeoutMs: number,
): Promise<
  | { ok: true; json: unknown; status: number }
  | { ok: false; error: string; status: number | null }
> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: githubHeaders(token),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `GitHub HTTP ${response.status}`,
        status: response.status,
      };
    }
    return { ok: true, json: await response.json(), status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "GitHub unreachable",
      status: null,
    };
  }
}

/**
 * Fixed argv only: `gh api <path>` — never shell, never `gh auth token`.
 * Path must already be validated by apiUrlToGhPath.
 */
async function ghApiGet(
  path: string,
  timeoutMs: number,
): Promise<
  | { ok: true; json: unknown }
  | { ok: false; error: string; status: number | null }
> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", path], {
      cwd: process.cwd(),
      timeout: timeoutMs,
      maxBuffer: 2 * 1024 * 1024,
      env: {
        ...process.env,
        // Prevent interactive prompts; never log tokens.
        GH_PROMPT_DISABLED: "1",
        GIT_TERMINAL_PROMPT: "0",
      },
    });
    return { ok: true, json: JSON.parse(stdout) as unknown };
  } catch (error) {
    const err = error as {
      message?: string;
      stderr?: string;
      stdout?: string;
      code?: number | string;
    };
    const detail = [err.stderr, err.message].filter(Boolean).join(" ").slice(0, 240);
    // Never echo credential material if gh somehow printed it.
    const sanitized = detail
      .replace(/gho_[A-Za-z0-9_]+/g, "[REDACTED]")
      .replace(/ghp_[A-Za-z0-9_]+/g, "[REDACTED]")
      .replace(/github_pat_[A-Za-z0-9_]+/g, "[REDACTED]");
    return {
      ok: false,
      error: `gh api failed: ${sanitized || "unknown"}`,
      status: typeof err.code === "number" ? err.code : null,
    };
  }
}

/**
 * Prefer explicit token REST; else local `gh api` fixed argv; else NOT_CONNECTED.
 * Never invents data. Never returns credentials.
 */
export async function githubApiGet(
  url: string,
  options?: {
    timeoutMs?: number;
    env?: NodeJS.ProcessEnv;
  },
): Promise<GithubGetResult> {
  const env = options?.env ?? process.env;
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const token = optionalGithubToken(env);

  if (token) {
    const res = await restGet(url, token, timeoutMs);
    if (res.ok) {
      return { ok: true, json: res.json, source: "REST_AUTHENTICATED" };
    }
    // Authenticated REST failed — still try local gh if allowed (token may be wrong scope).
    if (!isLocalGithubCliFallbackAllowed(env)) {
      return {
        ok: false,
        error: res.error,
        status: res.status,
        source: "NOT_CONNECTED",
      };
    }
  } else if (!isLocalGithubCliFallbackAllowed(env)) {
    // Unauthenticated REST often 403 — do not invent; mark NOT_CONNECTED.
    const probe = await restGet(url, null, Math.min(timeoutMs, 6_000));
    if (probe.ok) {
      // Public data without auth — still not "authenticated".
      return {
        ok: false,
        error: "Unauthenticated GitHub REST is not accepted as remote truth",
        status: probe.status,
        source: "NOT_CONNECTED",
      };
    }
    return {
      ok: false,
      error: probe.error,
      status: probe.status,
      source: "NOT_CONNECTED",
    };
  }

  const path = apiUrlToGhPath(url);
  if (!path) {
    return {
      ok: false,
      error: "Invalid GitHub API URL for gh fallback",
      status: null,
      source: "NOT_CONNECTED",
    };
  }

  const gh = await ghApiGet(path, timeoutMs);
  if (gh.ok) {
    return { ok: true, json: gh.json, source: "GH_CLI_AUTHENTICATED" };
  }
  return {
    ok: false,
    error: gh.error,
    status: gh.status,
    source: "NOT_CONNECTED",
  };
}
