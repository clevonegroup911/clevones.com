import { type ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CtaButtonGroup } from "@/components/ui/cta-button-group";
import { Divider } from "@/components/ui/divider";
import { Eyebrow, Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { PAGE_HERO_ID } from "@/lib/constants/mobile-cta";
import {
  buttonFullMobile,
  heroGoldOrb,
  heroGridOverlay,
  heroGridOverlayStyle,
  heroSubtitle,
} from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type PageHeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  maxWidth?: "3xl" | "4xl";
  actions?: readonly PageHeroAction[];
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  tagline,
  maxWidth = "4xl",
  actions,
  children,
}: PageHeroProps) {
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
        <div className={cn("min-w-0", maxWidth === "3xl" ? "max-w-3xl" : "max-w-4xl")}>
          {children}
          <Eyebrow tone="inverse">{eyebrow}</Eyebrow>
          <Divider variant="gold" accent className="mt-6" />
          <Heading as="h1" level={1} tone="inverse" className="mt-8">
            {title}
          </Heading>
          {subtitle ? <p className={heroSubtitle}>{subtitle}</p> : null}
          {tagline ? (
            <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase sm:mt-10 sm:tracking-[0.25em]">
              {tagline}
            </p>
          ) : null}
          {actions && actions.length > 0 ? (
            <CtaButtonGroup className="mt-8 sm:mt-10">
              {actions.map((action) => (
                <ButtonLink
                  key={action.href + action.label}
                  href={action.href}
                  variant={action.variant ?? "secondary"}
                  size="lg"
                  className={cn(
                    action.variant === "outline"
                      ? "border-border text-white hover:bg-navy-hover"
                      : undefined,
                    buttonFullMobile,
                  )}
                >
                  {action.label}
                </ButtonLink>
              ))}
            </CtaButtonGroup>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
