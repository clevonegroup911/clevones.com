import { createPageMetadata } from "@/lib/metadata";

import { AgenticModelInfographic } from "@/app/admin/x200/agentic-model-infographic";
import { AgenticObservabilityPanels } from "@/app/admin/x200/agentic-panels";
import { ControlCenterClient } from "@/app/admin/x200/control-center-client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { buildAgenticObservabilitySnapshot, loadAgenticObservabilitySnapshot } from "@/lib/agentic/observability";
import {
  buildControlCenterFatalSnapshot,
  getControlCenterSnapshot,
} from "@/lib/x200/control-center";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "X200 Control Center",
  description:
    "Operational mirror + universal action console X200 — faits vérifiés, Human Gates, pas de shell libre.",
  path: "/admin/x200",
  robots: { index: false, follow: false },
});

export default async function AdminX200ControlCenterPage() {
  const actor = await requireAdmin();
  let snapshot;
  try {
    snapshot = await getControlCenterSnapshot({ actorRole: actor.role });
  } catch (error) {
    // Auth succeeded; monitoring assembly must not become HTTP 500.
    snapshot = buildControlCenterFatalSnapshot(error);
  }

  let agenticSnapshot;
  try {
    agenticSnapshot = await loadAgenticObservabilitySnapshot();
  } catch {
    agenticSnapshot = buildAgenticObservabilitySnapshot();
  }

  return (
    <>
      <ControlCenterClient
        snapshot={snapshot}
        actorRole={actor.role}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <AgenticModelInfographic />
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <AgenticObservabilityPanels snapshot={agenticSnapshot} />
      </div>
    </>
  );
}
