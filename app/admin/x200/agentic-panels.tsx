import type { AgenticObservabilitySnapshot } from "@/lib/agentic/observability";

function Card({
  title,
  children,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-sm border border-border-subtle bg-surface-elevated p-4 sm:p-5"
    >
      <h2 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Read-only agentic observability for Control Center.
 * No live provider calls; no action buttons that execute tools.
 */
export function AgenticObservabilityPanels({
  snapshot,
}: {
  snapshot: AgenticObservabilitySnapshot;
}) {
  return (
    <div className="mt-8 space-y-4" data-testid="agentic-observability">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
          Agentic observability
        </h2>
        <p className="text-xs text-gray-muted">
          {snapshot.liveProvidersDisabled
            ? "Live providers disabled"
            : "Live providers"}{" "}
          · {snapshot.generatedAt}
        </p>
      </div>
      <p className="text-sm text-gray-muted">{snapshot.note}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Agent registry" testId="agentic-registry">
          <ul className="space-y-2 text-sm">
            {snapshot.agents.map((agent) => (
              <li
                key={agent.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle/60 pb-2 last:border-0"
              >
                <span className="font-medium text-foreground">{agent.displayName}</span>
                <span className="text-xs text-gray-muted">
                  {agent.provider} · {agent.status} · cost {agent.estimatedCostPerTask} ·
                  risk≤{agent.maxRisk} · tools {agent.toolCount}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent tool audits" testId="agentic-audits">
          {snapshot.recentAudits.length === 0 ? (
            <p className="text-sm text-gray-muted">No in-process audits yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {snapshot.recentAudits.map((row) => (
                <li key={row.id} className="border-b border-border-subtle/60 pb-2 last:border-0">
                  <div className="font-medium text-foreground">
                    {row.agentId} → {row.tool}
                  </div>
                  <div className="text-xs text-gray-muted">
                    {row.status} · {row.code}
                    {row.approvalRequired ? " · approval" : ""} · {row.at}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent orchestrations" testId="agentic-orchestrations">
          {snapshot.recentOrchestrations.length === 0 ? (
            <p className="text-sm text-gray-muted">
              No orchestration traces attached to this snapshot.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {snapshot.recentOrchestrations.map((row) => (
                <li
                  key={row.correlationId}
                  className="border-b border-border-subtle/60 pb-2 last:border-0"
                >
                  <div className="font-medium text-foreground">
                    {row.taskClass} · {row.status}
                  </div>
                  <div className="text-xs text-gray-muted">
                    {row.correlationId} · moneyMoved={String(row.moneyMoved)}
                  </div>
                  <div className="mt-1 text-xs text-gray-muted">
                    {row.steps.map((s) => `${s.name}${s.ok ? "" : "!"}`).join(" → ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
