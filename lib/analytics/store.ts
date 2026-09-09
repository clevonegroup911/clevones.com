import "server-only";

import { prisma } from "@/lib/db/prisma";

import type { AnalyticsEventRecord, AnalyticsStore } from "./types";
import type { AnalyticsEventName } from "./types";

let storeOverride: AnalyticsStore | null = null;

export function setAnalyticsStoreForTests(store: AnalyticsStore | null): void {
  storeOverride = store;
}

export function getAnalyticsStore(): AnalyticsStore {
  return storeOverride ?? prismaAnalyticsStore;
}

function toRecord(row: {
  id: string;
  name: string;
  category: AnalyticsEventRecord["category"];
  path: string;
  locale: string | null;
  actorKind: AnalyticsEventRecord["actorKind"];
  day: Date;
  createdAt: Date;
}): AnalyticsEventRecord {
  return {
    id: row.id,
    name: row.name as AnalyticsEventName,
    category: row.category,
    path: row.path,
    locale: row.locale,
    actorKind: row.actorKind,
    day: row.day,
    createdAt: row.createdAt,
  };
}

export const prismaAnalyticsStore: AnalyticsStore = {
  async create(event) {
    const row = await prisma.analyticsEvent.create({
      data: {
        name: event.name,
        category: event.category,
        path: event.path,
        locale: event.locale,
        actorKind: event.actorKind,
        day: event.day,
        createdAt: event.createdAt,
      },
    });
    return toRecord(row);
  },
  async listSince(since) {
    const rows = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        name: true,
        category: true,
        path: true,
        locale: true,
        actorKind: true,
        day: true,
        createdAt: true,
      },
    });
    return rows.map(toRecord);
  },
};
