import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CtaButtonGroup } from "@/components/ui/cta-button-group";
import { Divider } from "@/components/ui/divider";
import { Eyebrow, Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  buttonFullMobile,
  cardAccentLine,
  heroGoldOrb,
  heroGridOverlay,
  heroGridOverlayStyle,
} from "@/lib/ui-classes";
import { PAGE_HERO_ID } from "@/lib/constants/mobile-cta";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";
import { cn } from "@/lib/utils";

export async function HeroSection() {
  const { pages } = await getLocaleContent();
  const homeHero = pages.home.hero;
  return (
    <Section
      id={PAGE_HERO_ID}
      tone="navy"
      spacing="lg"
      bordered="bottom"
      className="relative overflow-hidden"
    >
      <div
        className={heroGridOverlay}
        style={heroGridOverlayStyle}
        aria-hidden
      />
      <div className={heroGoldOrb} aria-hidden />
      <Container className="relative">
        <div className="max-w-4xl min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow tone="inverse">{homeHero.eyebrow}</Eyebrow>
            <Badge
              variant="outline"
              className="border-gold/30 bg-transparent text-gold-muted"
            >
              {homeHero.badge}
            </Badge>
          </div>

          <Divider variant="gold" accent className="mt-5 sm:mt-6" />

          <Heading as="h1" level={1} tone="inverse" className="mt-6 sm:mt-8">
            {homeHero.title}
          </Heading>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-gray-muted sm:mt-6 sm:text-lg lg:text-xl lg:leading-relaxed">
            {homeHero.subtitle}
          </p>

          <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-gold-muted sm:mt-6 sm:text-base">
            {homeHero.valueProposition}
          </p>

          <CtaButtonGroup className="mt-8 sm:mt-10">
            <ButtonLink
              href={homeHero.primaryCta.href}
              variant="secondary"
              size="lg"
              className={buttonFullMobile}
            >
              {homeHero.primaryCta.label}
            </ButtonLink>
            <ButtonLink
              href={homeHero.secondaryCta.href}
              variant="outline"
              size="lg"
              className={cn(
                "border-border text-white hover:bg-navy-hover",
                buttonFullMobile,
              )}
            >
              {homeHero.secondaryCta.label}
            </ButtonLink>
          </CtaButtonGroup>

          <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase sm:mt-10 sm:tracking-[0.25em]">
            {homeHero.trustLine}
          </p>
        </div>

        <div className="mt-12 border-t border-white/10 pt-10 sm:mt-14 sm:pt-12 lg:mt-16">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {homeHero.benefits.map((benefit) => (
              <li key={benefit.title} className="group min-w-0">
                <div className={cardAccentLine} aria-hidden />
                <p className="font-heading text-base font-semibold tracking-tight text-white sm:text-lg">
                  {benefit.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-muted">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
