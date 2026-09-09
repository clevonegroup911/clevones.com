import { randomBytes } from "node:crypto";

import type { AnalyticsEventRecord, AnalyticsStore } from "./types";

export function createMemoryAnalyticsStore(
  seed: AnalyticsEventRecord[] = [],
): AnalyticsStore & { records: AnalyticsEventRecord[] } {
  const records: AnalyticsEventRecord[] = [...seed];
  return {
    records,
    async create(event) {
      const record: AnalyticsEventRecord = {
        ...event,
        id: `evt_${randomBytes(8).toString("hex")}`,
      };
      records.push(record);
      return record;
    },
    async listSince(since) {
      return records.filter((item) => item.createdAt >= since);
    },
  };
}
