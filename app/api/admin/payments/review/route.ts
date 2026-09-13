import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { resolvePersistedHumanReview } from "@/lib/payments/activation";
import { canAccessAdminPayments } from "@/lib/payments/access";
import { adminReviewResolveSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

/**
 * Approve / reject d’une décision HUMAN_REVIEW.
 * approve → VERIFIED + activation gateway ; reject → REJECTED.
 */
export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessAdminPayments(actor.role)) {
    return NextResponse.json({ error: "Accès admin paiements refusé." }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = adminReviewResolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  try {
    const result = await resolvePersistedHumanReview({
      decisionId: parsed.data.decisionId,
      action: parsed.data.action,
      actorId: actor.id,
      note: parsed.data.note,
    });

    return NextResponse.json({
      decisionId: result.decision.id,
      status: result.decision.status,
      paymentId: result.decision.paymentId,
      orderStatus: result.chain?.order.status ?? null,
      invoiceStatus: result.chain?.invoice.status ?? null,
      receiptNumber: result.chain?.receipt?.receiptNumber ?? null,
      message:
        parsed.data.action === "approve"
          ? "HUMAN_REVIEW approuvée → VERIFIED + activation sandbox."
          : "HUMAN_REVIEW rejetée → REJECTED.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "review_failed";
    const status =
      code === "decision_not_found"
        ? 404
        : code === "decision_not_in_human_review"
          ? 409
          : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
