import { GovernancePageContent } from "@/components/sections/governance-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ ...getContent("fr").pages.governance.meta, path: "/gouvernance", locale: "fr", pageKey: "governance", hrefLang: true });
export default function GouvernancePage() { return <GovernancePageContent />; }
