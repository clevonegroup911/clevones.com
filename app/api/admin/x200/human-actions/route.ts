import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { assertSameOriginMutation } from "@/lib/http/same-origin";
import { readJsonBody } from "@/lib/http/read-json-body";
import {
  FORBIDDEN_ACTION_KEYS,
  executeHumanAction,
  humanActionRequestSchema,
} from "@/lib/x200/actions/executor";
import { resolveGithubActionAdapterMode } from "@/lib/x200/actions/merge";
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

  if (json.body && typeof json.body === "object" && !Array.isArray(json.body)) {
    const keys = Object.keys(json.body as Record<string, unknown>);
    if (FORBIDDEN_ACTION_KEYS.some((key) => keys.includes(key))) {
      return noStoreJson(
        {
          error: "Payload interdit — commandes arbitraires refusées.",
          code: "INVALID_ACTION",
        },
        { status: 400 },
      );
    }
  }

  const parsed = humanActionRequestSchema.safeParse(json.body);
  if (!parsed.success) {
    return noStoreJson(
      {
        error: "Action humaine invalide. Enum + Zod strict uniquement.",
        code: "INVALID_ACTION",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const adapterMode = resolveGithubActionAdapterMode();
  if (!parsed.data.previewOnly && adapterMode === "MOCK") {
    return noStoreJson(
      {
        ok: false,
        code: "ADAPTER_MOCK",
        message:
          "GITHUB ACTION ADAPTER = MOCK — mutations disabled outside injected tests",
        adapterMode,
      },
      { status: 403 },
    );
  }

  const snapshot = await getControlCenterSnapshot({
    actorRole: actor.role,
  }).catch((error) => buildControlCenterFatalSnapshot(error));

  const outcome = await executeHumanAction(parsed.data, {
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    git: snapshot.git,
    github: snapshot.github,
    humanGate: snapshot.humanGate,
    productComplete: snapshot.productComplete,
    fedora: snapshot.fedora,
    backupVerified: false,
  });

  // Invalidate pre-action GitHub snapshot — always re-read remote truth after mutation.
  const refreshed = await getControlCenterSnapshot({
    actorRole: actor.role,
  }).catch((error) => buildControlCenterFatalSnapshot(error));

  return noStoreJson(
    {
      ok: outcome.ok,
      code: outcome.code,
      message: outcome.message,
      preview: outcome.preview,
      receipt: outcome.receipt,
      approvalId: outcome.approvalId,
      challengeId: outcome.challengeId,
      expectedSha: outcome.expectedSha,
      currentSha: outcome.currentSha,
      adapterMode:
        refreshed.humanActions?.githubActionAdapter ?? adapterMode,
      github: {
        prNumber: refreshed.github.prNumber,
        prDraft: refreshed.github.prDraft,
        prState: refreshed.github.prState,
        prHeadSha: refreshed.github.prHeadSha,
        prUrl: refreshed.github.prUrl,
        status: refreshed.github.status,
      },
      snapshot: refreshed,
    },
    { status: outcome.status },
  );
}
