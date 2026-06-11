import { createPageMetadata } from "@/lib/metadata";

import { InsightsPageContent } from "@/components/sections/insights-page";

export const metadata = createPageMetadata({
  title: "Insights",
  description:
    "Strategic analysis on territorial economic governance, flow structuring, logistics governance, institutional coordination, and investment readiness in Africa.",
  path: "/insights",
});

export default function InsightsPage() {
  return <InsightsPageContent />;
}
