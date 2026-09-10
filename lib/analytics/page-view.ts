import { headers } from "next/headers";

import { trackAnalyticsEvent } from "@/lib/analytics/track";

/** Server-side page view beacon for public/admin layouts (no client tracker). */
export async function recordPageView(fallbackPath = "/") {
  const headerStore = await headers();
  const path =
    headerStore.get("x-pathname") ||
    headerStore.get("x-url") ||
    headerStore.get("next-url") ||
    fallbackPath;
  await trackAnalyticsEvent({
    name: "PAGE_VIEW",
    path: path.slice(0, 500),
  });
}
