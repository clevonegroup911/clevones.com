import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";
import { buttonFullMobile, cardAccentLine } from "@/lib/ui-classes";

export type FeaturedDmsContent = {
  eyebrow: string;
  name: string;
  type: string;
  positioning: string;
  description: string;
  capabilitiesLabel: string;
  functions: readonly string[];
  note: string;
  href: string;
  cta: string;
};

export function FeaturedDmsSection({
  content,
  tone = "elevated",
}: {
  content: FeaturedDmsContent;
  tone?: "default" | "elevated" | "muted";
}) {
  return (
    <Section tone={tone} spacing="md" bordered="bottom">
      <Container>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.name}
          description={content.positioning}
        />
        <Card
          variant="elevated"
          padding="md"
          className="mt-10 border-gold/20 sm:mt-12"
        >
          <div className={cardAccentLine} aria-hidden />
          <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
            {content.type}
          </p>
          <CardTitle className="mt-3 text-xl sm:text-2xl">{content.name}</CardTitle>
          <p className="mt-2 text-sm font-medium text-gold-muted">
            {content.positioning}
          </p>
          <CardDescription className="mt-4 max-w-3xl text-base">
            {content.description}
          </CardDescription>
          <p className="mt-8 text-xs font-semibold tracking-[0.15em] text-white uppercase">
            {content.capabilitiesLabel}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {content.functions.map((fn) => (
              <li
                key={fn}
                className="border-l border-gold/30 pl-3 text-sm text-muted"
              >
                {fn}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-navy-muted">
            {content.note}
          </p>
          <div className="mt-8">
            <ButtonLink
              href={content.href}
              variant="secondary"
              className={buttonFullMobile}
            >
              {content.cta}
            </ButtonLink>
          </div>
        </Card>
      </Container>
    </Section>
  );
}

export async function FeaturedDmsHomeSection() {
  const { pages } = await getLocaleContent();
  return <FeaturedDmsSection content={pages.home.featuredSolution} />;
}
