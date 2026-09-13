import { NextResponse } from "next/server";
import { z } from "zod";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import {
  buildControlCenterFatalSnapshot,
  getControlCenterSnapshot,
} from "@/lib/x200/control-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  filter: z
    .enum([
      "all",
      "en_cours",
      "pretes",
      "terminees",
      "bloquees",
      "echouees",
    ])
    .default("all"),
  q: z.string().max(80).optional(),
});

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return noStoreJson({ error: "Non authentifié." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    filter: url.searchParams.get("filter") ?? "all",
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) {
    return noStoreJson({ error: "Query invalide." }, { status: 400 });
  }

  const snapshot = await getControlCenterSnapshot().catch((error) =>
    buildControlCenterFatalSnapshot(error),
  );
  let tasks = snapshot.backlog.tasks;

  switch (parsed.data.filter) {
    case "en_cours":
      tasks = tasks.filter(
        (task) =>
          task.status === "EN_COURS" || task.status === "EN_CONTRÔLE",
      );
      break;
    case "pretes":
      tasks = tasks.filter((task) => task.status === "PRÊTE");
      break;
    case "terminees":
      tasks = tasks.filter((task) => task.status === "TERMINÉE");
      break;
    case "bloquees":
      tasks = tasks.filter((task) => task.status === "BLOQUÉE");
      break;
    case "echouees":
      tasks = tasks.filter((task) => task.status === "ÉCHOUÉE");
      break;
    default:
      break;
  }

  const q = parsed.data.q?.trim().toLowerCase();
  if (q) {
    tasks = tasks.filter(
      (task) =>
        task.id.toLowerCase().includes(q) ||
        task.title.toLowerCase().includes(q),
    );
  }

  return noStoreJson({
    generatedAt: snapshot.generatedAt,
    sources: { backlog: snapshot.sources.backlog },
    freshness: { backlog: snapshot.freshness.backlog },
    warnings: snapshot.warnings.filter((w) =>
      w.toLowerCase().includes("backlog"),
    ),
    counts: snapshot.backlog.counts,
    filter: parsed.data.filter,
    q: parsed.data.q ?? null,
    tasks,
  });
}
