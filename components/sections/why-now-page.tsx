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

export async function WhyNowPageSection() {
  const { locale, pages } = await getLocaleContent();
  const whyNow = pages.whyNow;
  const homePath = resolvePagePath("home", locale) ?? "/";
  const whyNowPath = resolvePagePath("whyNow", locale) ?? "/why-now";

  return (
    <>
      <WebPageJsonLd
        name={whyNow.meta.title}
        description={whyNow.meta.description}
        path={whyNowPath}
        locale={locale}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: whyNow.breadcrumb.home, path: homePath },
          { name: whyNow.breadcrumb.current, path: whyNowPath },
        ]}
      />

      <PageHero
        eyebrow={whyNow.hero.eyebrow}
        title={whyNow.hero.title}
        subtitle={whyNow.hero.subtitle}
        tagline={whyNow.hero.tagline}
      >
        <PageBreadcrumb
          ariaLabel={whyNow.breadcrumb.navLabel}
          items={[
            { label: whyNow.breadcrumb.home, href: homePath },
            { label: whyNow.breadcrumb.current },
          ]}
        />
      </PageHero>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={whyNow.acceleratingForces.eyebrow}
            title={whyNow.acceleratingForces.title}
            description={whyNow.acceleratingForces.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {whyNow.acceleratingForces.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <ProseSection
        eyebrow={whyNow.currentLimits.eyebrow}
        title={whyNow.currentLimits.title}
        paragraphs={whyNow.currentLimits.paragraphs}
        tone="muted"
      />

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container size="prose">
          <SectionHeading
            eyebrow={whyNow.requiredCapabilities.eyebrow}
            title={whyNow.requiredCapabilities.title}
            description={whyNow.requiredCapabilities.description}
          />
          <ul className="mt-8 list-none space-y-3 sm:mt-10">
            {whyNow.requiredCapabilities.items.map((item, index) => (
              <li
                key={item}
                className="flex gap-4 border-l-2 border-gold pl-5 text-sm leading-relaxed text-muted sm:text-base"
              >
                <span className="sr-only">
                  {index + 1}.{" "}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ProseSection
        eyebrow={whyNow.handoff.eyebrow}
        title={whyNow.handoff.title}
        paragraphs={whyNow.handoff.paragraphs}
        tone="default"
      />

      <PageCtaSection
        title={whyNow.cta.title}
        description={whyNow.cta.description}
        actions={[...whyNow.cta.actions]}
      />
    </>
  );
}
