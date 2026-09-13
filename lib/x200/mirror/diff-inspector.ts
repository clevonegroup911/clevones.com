import { redactMonitoringText } from "@/lib/x200/activity";
import type {
  DiffFileEntry,
  DiffInspectorSnapshot,
} from "@/lib/x200/mirror/types";

const SECRET_PATH_HINT =
  /(^|\/)(\.env(\.|$)|.*credentials.*|.*secret.*|.*\.pem$|.*id_rsa)/i;

export function classifyDiffStatus(
  statusCode: string,
): DiffFileEntry["status"] {
  const code = statusCode.trim().charAt(0).toUpperCase();
  if (code === "A") return "added";
  if (code === "M") return "modified";
  if (code === "D") return "deleted";
  if (code === "R") return "renamed";
  return "unknown";
}

export function shouldRedactDiffPath(path: string): boolean {
  return SECRET_PATH_HINT.test(path);
}

export function buildDiffInspectorFromGitNameStatus(input: {
  nameStatusStdout: string;
  numstatStdout: string;
  commits: Array<{ sha: string; subject: string; at: string | null }>;
  warning?: string | null;
}): DiffInspectorSnapshot {
  const files: DiffFileEntry[] = [];
  const lines = input.nameStatusStdout
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  const numstat = new Map<string, { add: number; del: number }>();
  for (const line of input.numstatStdout.split("\n")) {
    if (!line.trim()) continue;
    const [addRaw, delRaw, ...pathParts] = line.split("\t");
    const path = pathParts.join("\t").trim();
    if (!path) continue;
    if (shouldRedactDiffPath(path)) continue;
    const add = addRaw === "-" ? null : Number(addRaw);
    const del = delRaw === "-" ? null : Number(delRaw);
    numstat.set(path, {
      add: add != null && Number.isFinite(add) ? add : 0,
      del: del != null && Number.isFinite(del) ? del : 0,
    });
  }

  for (const line of lines) {
    const parts = line.split("\t");
    const statusRaw = parts[0] ?? "";
    const path = parts[1] ?? parts.at(-1) ?? "";
    if (!path) continue;
    if (shouldRedactDiffPath(path)) {
      files.push({
        path: "[REDACTED_PATH]",
        status: classifyDiffStatus(statusRaw),
        additions: null,
        deletions: null,
      });
      continue;
    }
    const stats = numstat.get(path);
    files.push({
      path: redactMonitoringText(path, 240),
      status: classifyDiffStatus(statusRaw),
      additions: stats?.add ?? null,
      deletions: stats?.del ?? null,
    });
  }

  const added = files.filter((f) => f.status === "added").length;
  const modified = files.filter((f) => f.status === "modified").length;
  const deleted = files.filter((f) => f.status === "deleted").length;
  const linesAdded = files.reduce((sum, f) => sum + (f.additions ?? 0), 0);
  const linesDeleted = files.reduce((sum, f) => sum + (f.deletions ?? 0), 0);

  const summaryLines = files.slice(0, 40).map((f) => {
    const a = f.additions != null ? `+${f.additions}` : "";
    const d = f.deletions != null ? `-${f.deletions}` : "";
    return `${f.status} ${f.path} ${a}${d}`.trim();
  });

  return {
    status: "OK",
    filesChanged: files.length,
    added,
    modified,
    deleted,
    linesAdded,
    linesDeleted,
    files: files.slice(0, 200),
    commits: input.commits.slice(0, 20).map((c) => ({
      sha: c.sha,
      subject: redactMonitoringText(c.subject, 200),
      at: c.at,
    })),
    summaryRedacted: redactMonitoringText(summaryLines.join("\n"), 4000),
    warning: input.warning ?? null,
  };
}

export function emptyDiffInspector(
  warning: string | null,
): DiffInspectorSnapshot {
  return {
    status: "UNKNOWN",
    filesChanged: null,
    added: null,
    modified: null,
    deleted: null,
    linesAdded: null,
    linesDeleted: null,
    files: [],
    commits: [],
    summaryRedacted: null,
    warning,
  };
}
