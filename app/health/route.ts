import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unauthenticated liveness probe. Minimal payload — never dump env or secrets.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "clevones-com",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
