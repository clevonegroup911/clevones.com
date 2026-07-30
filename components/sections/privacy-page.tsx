import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContent, getLocaleFromHeaders } from "@/lib/i18n";
import { proseLink, proseStack } from "@/lib/ui-classes";
import { headers } from "next/headers";

export async function PrivacyPage() {
  const locale = getLocaleFromHeaders(await headers());
  const page = getContent(locale).pages.privacy;

  return (
    <Section spacing="md">
      <Container size="prose">
        <SectionHeading eyebrow={page.eyebrow} title={page.title} />
        <div className={`${proseStack} text-sm`}>
          {page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p>{page.contact.prefix} <a href={`mailto:${page.contact.email}`} className={proseLink}>{page.contact.email}</a>.</p>
        </div>
      </Container>
    </Section>
  );
}
