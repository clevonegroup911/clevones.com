import { SolutionsPageContent } from "@/components/sections/solutions-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ ...getContent("fr").pages.solutions.meta, path: "/domaines", locale: "fr", pageKey: "solutions", hrefLang: true });
export default function DomainesPage() { return <SolutionsPageContent />; }
