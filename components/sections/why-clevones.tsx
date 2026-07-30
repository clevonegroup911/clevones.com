import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonFullMobile, cardAccentLine } from "@/lib/ui-classes";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

/**
 * Condensed “Why Clevones” bridge on Home — not a Positioning duplicate.
 * Full is/is-not lives on the Positioning page.
 */
export async function WhyClevonesSection() {
  const { pages } = await getLocaleContent();
  const why = pages.home.whyClevones;

  return (
    <Section tone="elevated" spacing="md" bordered="top">
      <Container>
        <SectionHeading
          eyebrow={why.eyebrow}
          title={why.title}
          description={why.description}
        />
        <ul className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          {why.principles.map((principle) => (
            <li key={principle.title} className="group min-w-0">
              <div className={cardAccentLine} aria-hidden />
              <p className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {principle.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {principle.description}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-10 sm:mt-12">
          <ButtonLink
            href={why.cta.href}
            variant="outline"
            size="lg"
            className={buttonFullMobile}
          >
            {why.cta.label}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
