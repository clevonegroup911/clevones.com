import { ContactInitiativeForm } from "@/components/sections/contact-initiative-form";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { getContent, getLocaleFromHeaders } from "@/lib/i18n";
import { type ContactIntent } from "@/lib/i18n/content/pages";
import { headers } from "next/headers";

type ContactPageContentProps = {
  intent?: ContactIntent;
};

export async function ContactPageContent({
  intent = "collaboration",
}: ContactPageContentProps) {
  const locale = getLocaleFromHeaders(await headers());
  const page = getContent(locale).pages.contact;
  const content = page.intents[intent];

  return (
    <>
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
        tagline={page.hero.tagline}
      />

      <Section tone="elevated" spacing="sm" bordered="bottom">
        <Container size="prose">
          <div className="rounded-sm border border-border-subtle/60 bg-surface-muted px-5 py-6 sm:px-7 sm:py-7">
            <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
              {page.guidance.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {page.guidance.description}
            </p>
            <ol className="mt-5 space-y-3">
              {page.guidance.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 text-sm leading-relaxed text-soft-white"
                >
                  <span
                    className="shrink-0 font-heading text-sm font-semibold text-gold"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="default" spacing="md">
        <Container>
          <ContactInitiativeForm intent={intent} />
        </Container>
      </Section>
    </>
  );
}
