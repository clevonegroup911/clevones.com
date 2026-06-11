import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const levelStyles = {
  1: "text-[1.75rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.1] lg:text-6xl",
  2: "text-2xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight",
  3: "text-xl font-semibold leading-snug tracking-tight sm:text-2xl",
  4: "text-lg font-semibold leading-snug sm:text-xl",
  5: "text-base font-semibold leading-snug sm:text-lg",
  6: "text-sm font-semibold leading-snug tracking-wide uppercase",
} as const;

const toneStyles = {
  default: "text-foreground",
  inverse: "text-white",
  muted: "text-muted",
  gold: "text-gold",
} as const;

type HeadingLevel = keyof typeof levelStyles;
type HeadingTone = keyof typeof toneStyles;

type HeadingProps = ComponentPropsWithoutRef<"h1"> & {
  as?: `h${HeadingLevel}`;
  level?: HeadingLevel;
  tone?: HeadingTone;
  align?: "left" | "center";
};

export function Heading({
  className,
  as,
  level = 2,
  tone = "default",
  align = "left",
  ...props
}: HeadingProps) {
  const Tag = as ?? (`h${level}` as const);

  return (
    <Tag
      className={cn(
        "font-heading text-balance",
        levelStyles[level],
        toneStyles[tone],
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

type EyebrowProps = ComponentPropsWithoutRef<"p"> & {
  tone?: "default" | "inverse" | "gold";
};

const eyebrowToneStyles = {
  default: "text-gold-hover",
  inverse: "text-gold-muted",
  gold: "text-gold",
} as const;

export function Eyebrow({
  className,
  tone = "default",
  ...props
}: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.2em] uppercase",
        eyebrowToneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
