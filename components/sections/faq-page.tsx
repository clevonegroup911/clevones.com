import { Container } from "@/components/ui/container";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { homeCta } from "@/lib/home";
import { faqPageCta, faqPageHero, faqPageItems } from "@/lib/faq-page";

export function FaqPageContent() {
  return (
    <>
      <PageHero
        eyebrow={faqPageHero.eyebrow}
        title={faqPageHero.title}
        subtitle={faqPageHero.subtitle}
      />

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container size="prose">
          <SectionHeading
            eyebrow="Answers"
            title="What institutions most often need to clarify"
          />
          <div className="mt-10 space-y-6 sm:mt-12">
            {faqPageItems.map((item) => (
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
        title={faqPageCta.title}
        description={faqPageCta.description}
        actions={[
          {
            href: homeCta.collaboration.href,
            label: homeCta.collaboration.label,
          },
          {
            href: "/contact?intent=eligibility",
            label: "Check initiative eligibility",
            variant: "outline",
            className:
              "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
          },
        ]}
      />
    </>
  );
}
