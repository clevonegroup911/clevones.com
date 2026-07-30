import { BreadcrumbListJsonLd, WebPageJsonLd } from "@/components/seo/webpage-json-ld";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ExternalLink } from "@/components/ui/external-link";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cardAccentLine } from "@/lib/ui-classes";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";
import { resolvePagePath } from "@/lib/i18n/routes";

import { EcosystemMap } from "./ecosystem-map";

export async function EcosystemPageContent() {
  const { content, locale, pages } = await getLocaleContent();
  const platform = pages.ecosystem;
  const homePath = resolvePagePath("home", locale) ?? "/";
  const platformPath = resolvePagePath("ecosystem", locale) ?? "/ecosystem";

  const centralEntity = platform.modules.entities.find((entity) => entity.central)!;
  const neutralEntities = platform.modules.entities.filter(
    (entity) => !entity.central && !entity.operational,
  );
  const operationalEntity = platform.modules.entities.find(
    (entity) => entity.operational,
  )!;

  return (
    <>
      <WebPageJsonLd
        name={platform.meta.title}
        description={platform.meta.description}
        path={platformPath}
        locale={locale}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: platform.breadcrumb.home, path: homePath },
          { name: platform.breadcrumb.current, path: platformPath },
        ]}
      />

      <PageHero
        eyebrow={platform.hero.eyebrow}
        title={platform.hero.title}
        subtitle={platform.hero.subtitle}
        tagline={platform.hero.tagline}
        actions={[...platform.hero.actions]}
      >
        <PageBreadcrumb
          ariaLabel={platform.breadcrumb.navLabel}
          items={[
            { label: platform.breadcrumb.home, href: homePath },
            { label: platform.breadcrumb.current },
          ]}
        />
      </PageHero>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={platform.whyPlatform.eyebrow}
            title={platform.whyPlatform.title}
            description={platform.whyPlatform.description}
          />
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
            {platform.whyPlatform.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {platform.whyPlatform.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section
        id="architecture"
        tone="elevated"
        spacing="md"
        bordered="bottom"
        className="scroll-mt-24"
      >
        <Container>
          <SectionHeading
            eyebrow={platform.architecture.eyebrow}
            title={platform.architecture.title}
            description={platform.architecture.description}
          />
          <ol className="mt-10 space-y-0 sm:mt-12">
            {platform.architecture.steps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-5 border-l border-border-subtle py-5 pl-6 last:pb-0 sm:gap-6 sm:pl-8"
              >
                <span
                  className="absolute top-5 -left-px h-3 w-3 -translate-x-1/2 rounded-full bg-gold"
                  aria-hidden
                />
                <span
                  className="shrink-0 font-heading text-sm font-semibold text-gold"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold text-foreground sm:text-lg">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={platform.layers.eyebrow}
            title={platform.layers.title}
            description={platform.layers.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {platform.layers.items.map((item) => (
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
            eyebrow={platform.modules.eyebrow}
            title={platform.modules.title}
            description={platform.modules.description}
          />
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted sm:mt-8 sm:text-lg">
            {platform.modules.communication}
          </p>

          <div className="mt-10 sm:mt-12">
            <SectionHeading
              eyebrow={platform.map.eyebrow}
              title={platform.map.title}
              description={platform.map.description}
            />
            <EcosystemMap
              central={centralEntity}
              neutral={neutralEntities}
              operational={operationalEntity}
            />
          </div>

          <div className="mt-14 sm:mt-16">
            <SectionHeading
              eyebrow={platform.modules.rosterEyebrow}
              title={platform.modules.rosterTitle}
              description={platform.modules.rosterDescription}
            />
            <div className="mt-10 space-y-10 sm:mt-12 lg:mt-14">
              <Card
                variant="elevated"
                padding="md"
                className="mx-auto max-w-2xl border-gold/20 bg-surface-elevated"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className={cardAccentLine} aria-hidden />
                  <CardTitle className="text-lg">{centralEntity.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className="border-gold/30 text-gold-muted"
                  >
                    {platform.modules.centralBadge}
                  </Badge>
                </div>
                <p className="text-xs font-medium tracking-wide text-gold-muted">
                  {centralEntity.role}
                </p>
                <CardDescription className="mt-3">
                  {centralEntity.description}
                </CardDescription>
                <ExternalLink href={centralEntity.href} className="mt-5">
                  {centralEntity.domain}
                </ExternalLink>
              </Card>

              <div className="grid gap-5 sm:grid-cols-2">
                {neutralEntities.map((entity) => (
                  <Card
                    key={entity.name}
                    variant="default"
                    padding="md"
                    className="transition-colors hover:border-border-subtle"
                  >
                    <CardTitle className="text-lg">{entity.name}</CardTitle>
                    <p className="mt-2 text-xs font-medium tracking-wide text-gold-muted">
                      {entity.role}
                    </p>
                    <CardDescription className="mt-3">
                      {entity.description}
                    </CardDescription>
                    <ExternalLink href={entity.href} className="mt-5">
                      {entity.domain}
                    </ExternalLink>
                  </Card>
                ))}
              </div>

              <Card
                variant="outlined"
                padding="md"
                className="mx-auto max-w-2xl border-gold/20 bg-gold-subtle/30"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{operationalEntity.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className="border-gold/30 text-gold-muted"
                  >
                    {content.shell.operationalBadge}
                  </Badge>
                </div>
                <p className="text-xs font-medium tracking-wide text-gold-muted">
                  {operationalEntity.role}
                </p>
                <CardDescription className="mt-3">
                  {operationalEntity.description}
                </CardDescription>
                <ExternalLink href={operationalEntity.href} className="mt-5">
                  {operationalEntity.domain}
                </ExternalLink>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container size="prose">
          <div className="rounded-sm border border-gold/20 bg-gold-subtle/20 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase">
              {platform.disclaimerEyebrow}
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground sm:text-lg">
              {platform.disclaimer}
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={platform.decisionFlow.eyebrow}
            title={platform.decisionFlow.title}
            description={platform.decisionFlow.description}
          />
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
            {platform.decisionFlow.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {platform.decisionFlow.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCardGrid>
          <div className="mt-8">
            <ButtonLink
              href={platform.decisionFlow.doctrineLink.href}
              variant="outline"
            >
              {platform.decisionFlow.doctrineLink.label}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <PageCtaSection
        title={platform.cta.title}
        description={platform.cta.description}
        actions={[...platform.cta.actions]}
      />
    </>
  );
}
