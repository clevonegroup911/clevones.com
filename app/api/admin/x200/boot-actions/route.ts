import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { assertSameOriginMutation } from "@/lib/http/same-origin";
import { readJsonBody } from "@/lib/http/read-json-body";
import {
  bootActionRequestSchema,
  executeBootAction,
} from "@/lib/x200/boot/actions";

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
    return noStoreJson(
      { error: "Non authentifié.", code: "ACTION_NOT_ALLOWED" },
      { status: 401 },
    );
  }

  if (actor.role !== "SUPER_ADMIN") {
    return noStoreJson(
      {
        error: "Lecture seule — SUPER_ADMIN requis.",
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

  if (
    json.body &&
    typeof json.body === "object" &&
    !Array.isArray(json.body)
  ) {
    const keys = Object.keys(json.body as Record<string, unknown>);
    const forbidden = ["command", "args", "shell", "script", "cwd", "env", "unit"];
    if (forbidden.some((key) => keys.includes(key))) {
      return noStoreJson(
        {
          error: "Payload interdit — commandes/unités arbitraires refusées.",
          code: "INVALID_ACTION",
        },
        { status: 400 },
      );
    }
  }

  const parsed = bootActionRequestSchema.safeParse(json.body);
  if (!parsed.success) {
    return noStoreJson(
      {
        error: "Action invalide. Enum boot strict uniquement.",
        code: "INVALID_ACTION",
      },
      { status: 400 },
    );
  }

  const outcome = await executeBootAction(parsed.data.action, {
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    confirmDisable: parsed.data.confirmDisable,
  });

  return noStoreJson(
    {
      ok: outcome.ok,
      code: outcome.code,
      message: outcome.message,
      action: outcome.action,
      output: outcome.sanitizedOutput,
    },
    { status: outcome.status },
  );
}
