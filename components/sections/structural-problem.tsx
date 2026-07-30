import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonFullMobile } from "@/lib/ui-classes";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

/**
 * Home problem teaser only — full fragmentation narrative lives on Challenge.
 */
export async function StructuralProblemSection() {
  const { pages } = await getLocaleContent();
  const structuralProblem = pages.home.structuralProblem;

  return (
    <Section tone="default" spacing="md" bordered="top">
      <Container size="prose">
        <SectionHeading
          eyebrow={structuralProblem.eyebrow}
          title={structuralProblem.title}
          description={structuralProblem.description}
        />
        <p className="mt-6 text-base leading-relaxed text-muted sm:mt-8 sm:text-lg">
          {structuralProblem.consequence}
        </p>
        <div className="mt-8 sm:mt-10">
          <ButtonLink
            href={structuralProblem.cta.href}
            variant="outline"
            size="lg"
            className={buttonFullMobile}
          >
            {structuralProblem.cta.label}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
