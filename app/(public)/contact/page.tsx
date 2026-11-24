import { createPageMetadata } from "@/lib/metadata";
import { resolveContactIntent } from "@/lib/contact-page";
import { getContent } from "@/lib/i18n";

import { ContactPageContent } from "@/components/sections/contact-page";

export const metadata = createPageMetadata({
  ...getContent("en").pages.contact.meta,
  path: "/contact",
});

type ContactPageProps = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { intent: intentParam } = await searchParams;

  return (
    <ContactPageContent intent={resolveContactIntent(intentParam)} />
  );
}
