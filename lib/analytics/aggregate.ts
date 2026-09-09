import { utcDay } from "./sanitize";
import { getAnalyticsStore } from "./store";
import type {
  AnalyticsCountRow,
  AnalyticsDashboardSnapshot,
  AnalyticsEventRecord,
} from "./types";

function countBy(
  events: AnalyticsEventRecord[],
  keyOf: (event: AnalyticsEventRecord) => string,
): AnalyticsCountRow[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = keyOf(event);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

export async function getAnalyticsDashboardSnapshot(
  windowDays = 7,
  now = new Date(),
): Promise<AnalyticsDashboardSnapshot> {
  const days = Number.isFinite(windowDays) ? Math.min(Math.max(windowDays, 1), 90) : 7;
  const since = utcDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  const events = await getAnalyticsStore().listSince(since);

  return {
    windowDays: days,
    since: since.toISOString(),
    total: events.length,
    byCategory: countBy(events, (event) => event.category),
    byName: countBy(events, (event) => event.name),
    byActorKind: countBy(events, (event) => event.actorKind),
    byDay: countBy(events, (event) => utcDay(event.day).toISOString().slice(0, 10)),
    topPaths: countBy(events, (event) => event.path).slice(0, 12),
  };
}
