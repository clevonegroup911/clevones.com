import type { AnalyticsEventName, Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type AnalyticsClient = PrismaClient | Prisma.TransactionClient;

export const analyticsEventNames = [
  "PAGE_VIEW",
  "FORM_SUBMIT",
  "ADMIN_LOGIN",
  "DOCUMENT_UPLOAD",
  "DOCUMENT_DOWNLOAD",
  "COMMERCIAL_ACTION",
] as const;

export type TrackAnalyticsInput = {
  name: AnalyticsEventName;
  path?: string;
  label?: string;
  actorId?: string | null;
};

/** Fire-and-forget safe tracker: never throws to callers. */
export async function trackAnalyticsEvent(
  input: TrackAnalyticsInput,
  client: AnalyticsClient = prisma,
): Promise<void> {
  try {
    await client.analyticsEvent.create({
      data: {
        name: input.name,
        path: (input.path ?? "").slice(0, 500),
        label: (input.label ?? "").slice(0, 200),
        actorId: input.actorId ?? null,
      },
    });
  } catch {
    // Analytics must not break product flows.
  }
}

export type AnalyticsDashboard = {
  since: string;
  totals: Record<(typeof analyticsEventNames)[number], number>;
  topPages: Array<{ path: string; count: number }>;
  recent: Array<{
    id: string;
    name: AnalyticsEventName;
    path: string;
    label: string;
    createdAt: string;
  }>;
};

export async function getAnalyticsDashboard(
  days = 30,
  client: AnalyticsClient = prisma,
): Promise<AnalyticsDashboard> {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await client.analyticsEvent.findMany({
    where: { createdAt: { gte: sinceDate } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      id: true,
      name: true,
      path: true,
      label: true,
      createdAt: true,
    },
  });

  const totals = Object.fromEntries(
    analyticsEventNames.map((name) => [name, 0]),
  ) as Record<(typeof analyticsEventNames)[number], number>;

  const pageCounts = new Map<string, number>();
  for (const event of events) {
    totals[event.name] += 1;
    if (event.name === "PAGE_VIEW" && event.path) {
      pageCounts.set(event.path, (pageCounts.get(event.path) || 0) + 1);
    }
  }

  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    since: sinceDate.toISOString(),
    totals,
    topPages,
    recent: events.slice(0, 25).map((event) => ({
      id: event.id,
      name: event.name,
      path: event.path,
      label: event.label,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export function summarizeTotals(
  totals: AnalyticsDashboard["totals"],
): { visitorsProxy: number; forms: number; adminLogins: number; documents: number } {
  return {
    visitorsProxy: totals.PAGE_VIEW,
    forms: totals.FORM_SUBMIT,
    adminLogins: totals.ADMIN_LOGIN,
    documents: totals.DOCUMENT_UPLOAD + totals.DOCUMENT_DOWNLOAD,
  };
}
