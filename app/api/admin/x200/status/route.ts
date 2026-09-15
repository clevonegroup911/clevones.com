import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import {
  buildControlCenterFatalSnapshot,
  getControlCenterSnapshot,
} from "@/lib/x200/control-center";

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

/** Full ControlCenterSnapshot — live monitoring only. */
export async function GET() {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return noStoreJson({ error: "Non authentifié." }, { status: 401 });
  }

  const snapshot = await getControlCenterSnapshot({
    actorRole: actor.role,
  }).catch((error) => buildControlCenterFatalSnapshot(error));

  return noStoreJson(snapshot);
}
