import "server-only";

import {
  assertPrivacySafePayload,
  isAnalyticsEventName,
  sanitizeLocale,
  sanitizePath,
  utcDay,
} from "./sanitize";
import { getAnalyticsStore } from "./store";
import type {
  AnalyticsActorKind,
  AnalyticsEventRecord,
  TrackEventInput,
} from "./types";

export function normalizeTrackEvent(
  input: TrackEventInput,
  now = new Date(),
): Omit<AnalyticsEventRecord, "id"> {
  if (!isAnalyticsEventName(input.name)) {
    throw new Error("unknown analytics event name");
  }

  const payload = {
    name: input.name,
    category: input.category,
    path: sanitizePath(input.path),
    locale: sanitizeLocale(input.locale),
    actorKind: (input.actorKind ?? "ANONYMOUS") as AnalyticsActorKind,
    day: utcDay(now),
    createdAt: now,
  };
  assertPrivacySafePayload(payload);
  return payload;
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    await getAnalyticsStore().create(normalizeTrackEvent(input));
  } catch {
    // Analytics must never fail the product path.
  }
}

export async function trackPageView(input: {
  path: string;
  locale?: string | null;
  actorKind?: AnalyticsActorKind;
  admin?: boolean;
}): Promise<void> {
  const path = sanitizePath(input.path);
  if (path.startsWith("/api/") || path.startsWith("/_next")) {
    return;
  }
  await trackEvent({
    name: input.admin ? "admin_view" : "page_view",
    category: input.admin ? "ADMIN" : "PAGE",
    path,
    locale: input.locale,
    actorKind: input.actorKind,
  });
}
