import { CompanyContact } from "@/components/layout/company-contact";
import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";
import { proseStack } from "@/lib/ui-classes";

export async function AboutPageContent() {
  const { pages, content } = await getLocaleContent();
  const about = pages.about;
  const { shell } = content;

  return (
    <>
      <PageHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        subtitle={about.hero.subtitle}
        tagline={about.hero.tagline}
      />

      <ProseSection
        eyebrow={about.identity.eyebrow}
        title={about.identity.title}
        paragraphs={about.identity.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <ProseSection
        eyebrow={about.mission.eyebrow}
        title={about.mission.title}
        paragraphs={about.mission.paragraphs}
        tone="default"
        bordered="bottom"
      />

      <ProseSection
        eyebrow={about.vision.eyebrow}
        title={about.vision.title}
        paragraphs={about.vision.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={about.activities.eyebrow}
            title={about.activities.title}
            description={about.activities.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {about.activities.domains.map((domain) => (
              <FeatureCard
                key={domain.id}
                title={domain.title}
                description={
                  domain.ecosystemLink
                    ? `${domain.description} ${domain.ecosystemLink}.`
                    : domain.description
                }
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={about.ecosystem.eyebrow}
            title={about.ecosystem.title}
            description={about.ecosystem.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {about.ecosystem.items.map((item) => (
              <FeatureCard
                key={item.name}
                title={item.name}
                description={item.role}
              />
            ))}
          </FeatureCardGrid>
          <div className="mt-8">
            <TextLink href={about.ecosystem.href}>
              {about.ecosystem.linkLabel}
            </TextLink>
          </div>
        </Container>
      </Section>

      <ProseSection
        eyebrow={about.governance.eyebrow}
        title={about.governance.title}
        paragraphs={about.governance.paragraphs}
        tone="default"
        bordered="bottom"
      >
        <TextLink href={about.governance.href} className="mt-4">
          {about.governance.linkLabel}
        </TextLink>
      </ProseSection>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container size="prose">
          <SectionHeading
            eyebrow={about.legal.eyebrow}
            title={about.legal.title}
            description={about.legal.description}
          />
          <dl className="mt-10 grid gap-5 sm:grid-cols-2">
            {about.legal.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-2 text-sm text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
              {about.legal.addressLabel}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {about.legal.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
          <div className="mt-10">
            <CompanyContact
              location={shell.footerLocation}
              phoneLabel={shell.phoneLabel}
              emailLabel={shell.emailLabel}
            />
          </div>
          {about.legal.objetSocial ? (
            <div className={`${proseStack} mt-12 text-sm`}>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {about.legal.objetSocial.title}
              </h2>
              <p>{about.legal.objetSocial.intro}</p>
              <ul className="list-disc space-y-2 pl-5 text-muted">
                {about.legal.objetSocial.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{about.legal.objetSocial.closing}</p>
              <p>
                {about.legal.objetSocial.note}{" "}
                <TextLink href={about.legal.objetSocial.legalHref}>
                  {about.legal.objetSocial.legalLabel}
                </TextLink>
                .
              </p>
            </div>
          ) : null}
        </Container>
      </Section>

      <PageCtaSection
        title={about.cta.title}
        description={about.cta.description}
        actions={about.cta.actions.map((action) =>
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
