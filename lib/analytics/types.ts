export const ANALYTICS_CATEGORIES = ["PAGE", "FORM", "ADMIN", "DOCUMENT"] as const;
export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number];

export const ANALYTICS_ACTOR_KINDS = [
  "ANONYMOUS",
  "USER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;
export type AnalyticsActorKind = (typeof ANALYTICS_ACTOR_KINDS)[number];

export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "form_submit",
  "form_reject",
  "admin_view",
  "admin_mutation",
  "document_view",
  "document_upload",
  "document_download",
  "document_delete",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsEventRecord = {
  id: string;
  name: AnalyticsEventName;
  category: AnalyticsCategory;
  path: string;
  locale: string | null;
  actorKind: AnalyticsActorKind;
  day: Date;
  createdAt: Date;
};

export type TrackEventInput = {
  name: AnalyticsEventName;
  category: AnalyticsCategory;
  path: string;
  locale?: string | null;
  actorKind?: AnalyticsActorKind;
};

export type AnalyticsStore = {
  create(event: Omit<AnalyticsEventRecord, "id">): Promise<AnalyticsEventRecord>;
  listSince(since: Date): Promise<AnalyticsEventRecord[]>;
};

export type AnalyticsCountRow = {
  key: string;
  count: number;
};

export type AnalyticsDashboardSnapshot = {
  windowDays: number;
  since: string;
  total: number;
  byCategory: AnalyticsCountRow[];
  byName: AnalyticsCountRow[];
  byActorKind: AnalyticsCountRow[];
  byDay: AnalyticsCountRow[];
  topPaths: AnalyticsCountRow[];
};
