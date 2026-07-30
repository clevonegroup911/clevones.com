import { ContactPageContent } from "@/components/sections/contact-page";
import { resolveContactIntent } from "@/lib/contact-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";
export const metadata = createPageMetadata({ ...getContent("fr").pages.contact.meta, path: "/collaboration", locale: "fr", pageKey: "contact", hrefLang: true });
type Props = { searchParams: Promise<{ intent?: string }> };
export default async function CollaborationPage({ searchParams }: Props) {
  return <ContactPageContent intent={resolveContactIntent((await searchParams).intent)} />;
}
