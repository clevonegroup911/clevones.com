import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CtaButtonGroup } from "@/components/ui/cta-button-group";
import { Divider } from "@/components/ui/divider";
import { Eyebrow, Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  buttonFullMobile,
  heroGoldOrb,
  heroGridOverlay,
  heroGridOverlayStyle,
} from "@/lib/ui-classes";
import { PAGE_HERO_ID } from "@/lib/constants/mobile-cta";
import { homeCta } from "@/lib/home";
import { siteConfig } from "@/lib/site";

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
          <Eyebrow tone="inverse">{siteConfig.region}</Eyebrow>
          <Divider variant="gold" accent className="mt-5 sm:mt-6" />
          <Heading as="h1" level={1} tone="inverse" className="mt-6 sm:mt-8">
            Governance Architecture for Territorial Economic Flows
          </Heading>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-gray-muted sm:mt-6 sm:text-lg lg:text-xl lg:leading-relaxed">
            Clevones structures the governance, coordination, and strategic
            reporting of territorial economic initiatives in the Democratic
            Republic of Congo and Africa.
          </p>
          <CtaButtonGroup className="mt-8 sm:mt-10">
            <ButtonLink
              href={homeCta.collaboration.href}
              variant="secondary"
              size="lg"
              className={buttonFullMobile}
            >
              {homeCta.collaboration.label}
            </ButtonLink>
            <ButtonLink
              href={homeCta.initiative.href}
              variant="outline"
              size="lg"
              className={`border-border text-white hover:bg-navy-hover ${buttonFullMobile}`}
            >
              {homeCta.initiative.label}
            </ButtonLink>
          </CtaButtonGroup>
          <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase sm:mt-12 sm:tracking-[0.25em]">
            Neutral. Compliant. Non-operational.
          </p>
        </div>
      </Container>
    </Section>
  );
}
