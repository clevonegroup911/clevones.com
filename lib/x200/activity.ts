import type {
  ActivityItem,
  ControlCenterTask,
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ProductCompleteSnapshot,
} from "@/lib/x200/types";

/** Shared monitoring redaction — never leave env-key names that trip the scanner. */
export function redactMonitoringText(value: string, max = 280): string {
  return value
    .replace(
      /(authorization|bearer|token|password|secret|cookie|session)[=:\s]+[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/\bAUTH_SECRET\b/gi, "[REDACTED_ENV]")
    .replace(/\bMFA_ENCRYPTION_KEY\b/gi, "[REDACTED_ENV]")
    .replace(/\bDATABASE_URL\s*=\s*\S+/gi, "DATABASE_URL=[REDACTED]")
    .replace(/recovery\s*codes?/gi, "[REDACTED_RECOVERY]")
    .replace(/otpauth:\/\/\S+/gi, "[REDACTED_OTP]")
    .replace(/ghp_[A-Za-z0-9]{20,}/g, "[REDACTED_TOKEN]")
    .replace(/github_pat_[A-Za-z0-9_]{20,}/g, "[REDACTED_TOKEN]")
    .replace(/Bearer\s+[A-Za-z0-9._\-]{20,}/gi, "Bearer [REDACTED]")
    .replace(
      /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g,
      "[REDACTED_PRIVATE_KEY]",
    )
    .slice(0, max);
}

function redactActivityText(value: string): string {
  return redactMonitoringText(value, 280);
}

export function buildActivityFeed(input: {
  history: Array<{ at: string; taskId: string; status: string; note: string }>;
  tasks: ControlCenterTask[];
  git: GitSnapshot;
  github: GithubSnapshot;
  humanGate: HumanGateSnapshot;
  productComplete: ProductCompleteSnapshot;
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const entry of input.history.slice(-40).reverse()) {
    items.push({
      id: `history-${entry.taskId}-${entry.at}-${entry.status}`,
      at: entry.at,
      kind: "backlog",
      title: `${entry.taskId} → ${entry.status}`,
      detail: redactActivityText(entry.note || "backlog transition"),
    });
  }

  for (const task of input.tasks) {
    if (task.status === "EN_COURS" || task.status === "EN_CONTRÔLE") {
      items.push({
        id: `task-active-${task.id}`,
        at: task.updatedAt ?? "UNKNOWN",
        kind: "backlog",
        title: `Active ${task.id}`,
        detail: redactActivityText(
          `${task.title} · attempts=${task.attempts} · evidence=${task.evidenceCount}`,
        ),
      });
    }
    for (const evidence of task.evidence.slice(-2)) {
      items.push({
        id: `evidence-${task.id}-${evidence.slice(0, 24)}`,
        at: task.updatedAt ?? "UNKNOWN",
        kind: "backlog",
        title: `Evidence ${task.id}`,
        detail: redactActivityText(evidence),
      });
    }
  }

  for (const commit of input.git.recentCommits) {
    items.push({
      id: `git-${commit.sha}`,
      at: commit.at ?? "UNKNOWN",
      kind: "git",
      title: `Commit ${commit.sha.slice(0, 7)}`,
      detail: redactActivityText(commit.subject),
    });
  }

  if (input.github.ciLatestRunNumber != null) {
    items.push({
      id: `ci-${input.github.ciLatestRunId ?? input.github.ciLatestRunNumber}`,
      at: "UNKNOWN",
      kind: "ci",
      title: `CI run #${input.github.ciLatestRunNumber}`,
      detail: redactActivityText(
        [
          input.github.ciLatestName,
          input.github.ciLatestStatus,
          input.github.ciLatestConclusion,
        ]
          .filter(Boolean)
          .join(" · ") || "CI",
      ),
    });
  }

  if (input.humanGate.present) {
    items.push({
      id: "gate-active",
      at: input.humanGate.createdAt ?? "UNKNOWN",
      kind: "gate",
      title: "HUMAN_GATE",
      detail: redactActivityText(input.humanGate.reason ?? "gate present"),
    });
  }

  if (input.productComplete.present) {
    items.push({
      id: "product-complete",
      at: input.productComplete.generatedAt ?? "UNKNOWN",
      kind: "product",
      title: "PRODUCT_COMPLETE marker",
      detail: redactActivityText(
        input.productComplete.summary ??
          `head=${input.productComplete.head?.slice(0, 7) ?? "N/A"}`,
      ),
    });
  }

  return items
    .sort((a, b) => {
      const aTime = Date.parse(a.at);
      const bTime = Date.parse(b.at);
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
        return bTime - aTime;
      }
      if (Number.isFinite(aTime)) return -1;
      if (Number.isFinite(bTime)) return 1;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 50);
}

const FORBIDDEN_PAYLOAD_PATTERNS = [
  /AUTH_SECRET/i,
  /MFA_ENCRYPTION_KEY/i,
  /DATABASE_URL\s*=/i,
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /Bearer\s+[A-Za-z0-9._\-]{20,}/i,
  /recovery\s*codes?/i,
  /otpauth:\/\//i,
];

export function assertNoSecretsInPayload(payload: unknown): string[] {
  const json = JSON.stringify(payload);
  const hits: string[] = [];
  for (const pattern of FORBIDDEN_PAYLOAD_PATTERNS) {
    if (pattern.test(json)) {
      hits.push(pattern.source);
    }
  }
  return hits;
}
