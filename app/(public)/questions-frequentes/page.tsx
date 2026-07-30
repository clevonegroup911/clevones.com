import { FaqPageContent } from "@/components/sections/faq-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ ...getContent("fr").pages.faq.meta, path: "/questions-frequentes", locale: "fr", pageKey: "faq", hrefLang: true });
export default function QuestionsFrequentesPage() { return <FaqPageContent />; }
