import { InsightsPageContent } from "@/components/sections/insights-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ ...getContent("fr").pages.insights.meta, path: "/analyses", locale: "fr", pageKey: "insights", hrefLang: true });
export default function AnalysesPage() { return <InsightsPageContent />; }
