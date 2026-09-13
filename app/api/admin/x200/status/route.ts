import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { getControlCenterSnapshot } from "@/lib/x200/control-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return noStoreJson({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const snapshot = await getControlCenterSnapshot();
    return noStoreJson({
      generatedAt: snapshot.generatedAt,
      sources: snapshot.sources,
      freshness: snapshot.freshness,
      warnings: snapshot.warnings,
      systemHealth: snapshot.systemHealth,
      pipeline: snapshot.pipeline,
      currentTask: snapshot.backlog.currentTask,
      counts: snapshot.backlog.counts,
      productGoal: snapshot.productGoal,
      humanGate: snapshot.humanGate,
      productComplete: snapshot.productComplete,
      git: snapshot.git,
      github: snapshot.github,
      fedora: snapshot.fedora,
      efficiency: snapshot.efficiency,
      blockers: snapshot.blockers,
      lastUpdate: snapshot.lastUpdate,
    });
  } catch {
    return noStoreJson(
      { error: "Impossible de charger le statut X200." },
      { status: 500 },
    );
  }
}
