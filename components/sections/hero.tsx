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
import { homeHero } from "@/lib/home";
import { cn } from "@/lib/utils";

export function HeroSection() {
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

        <div className="mt-10 border-t border-white/10 pt-8 sm:mt-12 sm:pt-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase">
            {homeHero.proofs.label}
          </p>
          <ul className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-8 sm:gap-y-4">
            {homeHero.proofs.items.map((item) => (
              <li key={item.name} className="min-w-0">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p
                  className={cn(
                    "mt-0.5 text-xs leading-relaxed",
                    "operational" in item && item.operational
                      ? "text-gold-muted/90"
                      : "text-gray-muted",
                  )}
                >
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
