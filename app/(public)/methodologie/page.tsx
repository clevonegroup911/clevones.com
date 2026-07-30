import { MethodologyPageContent } from "@/components/sections/methodology-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ ...getContent("fr").pages.methodology.meta, path: "/methodologie", locale: "fr", pageKey: "methodology", hrefLang: true });
export default function MethodologiePage() { return <MethodologyPageContent />; }
