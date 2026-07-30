import { Container } from "@/components/ui/container";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function FaqPageContent() {
  const { pages } = await getLocaleContent();
  const faq = pages.faq;
  return (
    <>
      <PageHero
        eyebrow={faq.hero.eyebrow}
        title={faq.hero.title}
        subtitle={faq.hero.subtitle}
      />

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container size="prose">
          <SectionHeading
            eyebrow={faq.hero.eyebrow}
            title={faq.hero.title}
          />
          <div className="mt-10 space-y-6 sm:mt-12">
            {faq.items.map((item) => (
              <details
                key={item.question}
                className="group rounded-sm border border-border-subtle bg-surface px-5 py-4 open:border-gold/20 sm:px-6"
              >
                <summary className="cursor-pointer list-none font-heading text-base font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {item.question}
                    <span
                      className="mt-0.5 shrink-0 text-gold transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <PageCtaSection
        title={faq.cta.title}
        description={faq.cta.description}
        actions={faq.cta.actions.map((action) =>
          action.variant === "outline"
            ? {
                ...action,
                className:
                  "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
              }
            : action,
        )}
      />
    </>
  );
}
