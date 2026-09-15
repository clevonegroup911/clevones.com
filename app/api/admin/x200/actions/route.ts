import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { assertSameOriginMutation } from "@/lib/http/same-origin";
import { readJsonBody } from "@/lib/http/read-json-body";
import {
  controlActionRequestSchema,
  executeControlAction,
} from "@/lib/x200/control-actions";
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

export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return noStoreJson({ error: "Non authentifié.", code: "ACTION_NOT_ALLOWED" }, { status: 401 });
  }

  // USER never reaches admin session; ADMIN is read-only for mutations.
  if (actor.role !== "SUPER_ADMIN") {
    return noStoreJson(
      {
        error: "Lecture seule — SUPER_ADMIN requis pour les mutations.",
        code: "ACTION_NOT_ALLOWED",
      },
      { status: 403 },
    );
  }

  const csrf = assertSameOriginMutation(request);
  if (!csrf.ok) {
    return csrf.response;
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return json.response;
  }

  // Reject arbitrary command payloads before Zod (defense in depth).
  if (
    json.body &&
    typeof json.body === "object" &&
    !Array.isArray(json.body)
  ) {
    const keys = Object.keys(json.body as Record<string, unknown>);
    const forbidden = ["command", "args", "shell", "script", "cwd", "env"];
    if (forbidden.some((key) => keys.includes(key))) {
      return noStoreJson(
        {
          error: "Payload interdit — commandes arbitraires refusées.",
          code: "INVALID_ACTION",
        },
        { status: 400 },
      );
    }
  }

  const parsed = controlActionRequestSchema.safeParse(json.body);
  if (!parsed.success) {
    return noStoreJson(
      {
        error: "Action invalide. Enum strict uniquement.",
        code: "INVALID_ACTION",
      },
      { status: 400 },
    );
  }

  const snapshot = await getControlCenterSnapshot({
    actorRole: actor.role,
  }).catch((error) => buildControlCenterFatalSnapshot(error));

  const outcome = await executeControlAction(parsed.data.action, {
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    git: snapshot.git,
    humanGate: snapshot.humanGate,
    fedora: snapshot.fedora,
    currentTask: snapshot.backlog.currentTask,
  });

  return noStoreJson(
    {
      ok: outcome.ok,
      code: outcome.code,
      message: outcome.message,
      action: outcome.action,
      durationMs: outcome.durationMs,
      beforeState: outcome.beforeState,
      afterState: outcome.afterState,
      output: outcome.sanitizedOutput,
    },
    { status: outcome.status },
  );
}
