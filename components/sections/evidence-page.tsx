import { BreadcrumbListJsonLd, WebPageJsonLd } from "@/components/seo/webpage-json-ld";
import { ButtonLink } from "@/components/ui/button";
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

export async function EvidencePageSection() {
  const { locale, pages } = await getLocaleContent();
  const evidence = pages.evidence;
  const homePath = resolvePagePath("home", locale) ?? "/";
  const evidencePath = resolvePagePath("evidence", locale) ?? "/evidence";

  return (
    <>
      <WebPageJsonLd
        name={evidence.meta.title}
        description={evidence.meta.description}
        path={evidencePath}
        locale={locale}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: evidence.breadcrumb.home, path: homePath },
          { name: evidence.breadcrumb.current, path: evidencePath },
        ]}
      />

      <PageHero
        eyebrow={evidence.hero.eyebrow}
        title={evidence.hero.title}
        subtitle={evidence.hero.subtitle}
        tagline={evidence.hero.tagline}
        actions={[...evidence.hero.actions]}
      >
        <PageBreadcrumb
          ariaLabel={evidence.breadcrumb.navLabel}
          items={[
            { label: evidence.breadcrumb.home, href: homePath },
            { label: evidence.breadcrumb.current },
          ]}
        />
      </PageHero>

      <ProseSection
        id="methodology"
        eyebrow={evidence.methodology.eyebrow}
        title={evidence.methodology.title}
        paragraphs={evidence.methodology.paragraphs}
      >
        <div className="mt-8">
          <ButtonLink href={evidence.methodology.link.href} variant="outline">
            {evidence.methodology.link.label}
          </ButtonLink>
        </div>
      </ProseSection>

      <ProseSection
        eyebrow={evidence.architecture.eyebrow}
        title={evidence.architecture.title}
        paragraphs={evidence.architecture.paragraphs}
        tone="muted"
      >
        <div className="mt-8">
          <ButtonLink href={evidence.architecture.link.href} variant="outline">
            {evidence.architecture.link.label}
          </ButtonLink>
        </div>
      </ProseSection>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={evidence.documentation.eyebrow}
            title={evidence.documentation.title}
            description={evidence.documentation.description}
          />
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
            {evidence.documentation.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-10 space-y-4 sm:mt-12">
            {evidence.documentation.items.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-4 rounded-sm border border-border-subtle bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold text-foreground sm:text-lg">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {item.description}
                  </p>
                </div>
                <ButtonLink
                  href={item.href}
                  variant="outline"
                  className="shrink-0"
                >
                  {item.label}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={evidence.transparency.eyebrow}
            title={evidence.transparency.title}
            description={evidence.transparency.description}
          />
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
            {evidence.transparency.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {evidence.transparency.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={evidence.standards.eyebrow}
            title={evidence.standards.title}
            description={evidence.standards.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {evidence.standards.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
          <div className="mt-8">
            <ButtonLink href={evidence.standards.link.href} variant="outline">
              {evidence.standards.link.label}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={evidence.quality.eyebrow}
            title={evidence.quality.title}
            description={evidence.quality.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {evidence.quality.items.map((item) => (
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
            eyebrow={evidence.roadmap.eyebrow}
            title={evidence.roadmap.title}
            description={evidence.roadmap.description}
          />
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
            {evidence.roadmap.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-10 space-y-4 sm:mt-12">
            {evidence.roadmap.items.map((item, index) => (
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

      <PageCtaSection
        title={evidence.cta.title}
        description={evidence.cta.description}
        actions={[...evidence.cta.actions]}
      />
    </>
  );
}
