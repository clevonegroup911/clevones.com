import { BreadcrumbListJsonLd, WebPageJsonLd } from "@/components/seo/webpage-json-ld";
import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";
import { resolvePagePath } from "@/lib/i18n/routes";

export async function ChallengePageSection() {
  const { locale, pages } = await getLocaleContent();
  const challenge = pages.challenge;
  const homePath = resolvePagePath("home", locale) ?? "/";
  const challengePath = resolvePagePath("challenge", locale) ?? "/challenge";

  return (
    <>
      <WebPageJsonLd
        name={challenge.meta.title}
        description={challenge.meta.description}
        path={challengePath}
        locale={locale}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: challenge.breadcrumb.home, path: homePath },
          { name: challenge.breadcrumb.current, path: challengePath },
        ]}
      />

      <PageHero
        eyebrow={challenge.hero.eyebrow}
        title={challenge.hero.title}
        subtitle={challenge.hero.subtitle}
        tagline={challenge.hero.tagline}
      >
        <PageBreadcrumb
          ariaLabel={challenge.breadcrumb.navLabel}
          items={[
            { label: challenge.breadcrumb.home, href: homePath },
            { label: challenge.breadcrumb.current },
          ]}
        />
      </PageHero>

      <ProseSection
        eyebrow={challenge.centralProblem.eyebrow}
        title={challenge.centralProblem.title}
        paragraphs={challenge.centralProblem.paragraphs}
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={challenge.fragmentation.eyebrow}
            title={challenge.fragmentation.title}
            description={challenge.fragmentation.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {challenge.fragmentation.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={challenge.consequences.eyebrow}
            title={challenge.consequences.title}
            description={challenge.consequences.description}
          />
          <ul className="mt-10 space-y-4 sm:mt-12">
            {challenge.consequences.items.map((item, index) => (
              <li
                key={item.title}
                className="flex gap-5 rounded-sm border border-border-subtle bg-surface px-5 py-5 sm:px-6"
              >
                <span
                  className="shrink-0 font-heading text-sm font-semibold text-gold"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold text-foreground sm:text-lg">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ProseSection
        eyebrow={challenge.insufficientResponses.eyebrow}
        title={challenge.insufficientResponses.title}
        paragraphs={challenge.insufficientResponses.paragraphs}
        tone="elevated"
      />

      <ProseSection
        eyebrow={challenge.handoff.eyebrow}
        title={challenge.handoff.title}
        paragraphs={challenge.handoff.paragraphs}
        tone="default"
      />

      <PageCtaSection
        title={challenge.cta.title}
        description={challenge.cta.description}
        actions={[...challenge.cta.actions]}
      />
    </>
  );
}
