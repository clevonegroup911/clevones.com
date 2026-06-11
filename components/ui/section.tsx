import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const toneStyles = {
  default: "bg-background text-foreground",
  elevated: "bg-surface-elevated text-foreground",
  muted: "bg-surface-muted text-foreground",
  navy: "bg-navy text-white",
  charcoal: "bg-charcoal text-white",
} as const;

const spacingStyles = {
  sm: "py-10 sm:py-14 lg:py-16",
  md: "py-12 sm:py-16 lg:py-24",
  lg: "py-14 sm:py-20 lg:py-28",
  none: "",
} as const;

type SectionTone = keyof typeof toneStyles;
type SectionSpacing = keyof typeof spacingStyles;

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: SectionTone;
  spacing?: SectionSpacing;
  bordered?: boolean | "top" | "bottom";
};

export function Section({
  className,
  tone = "default",
  spacing = "md",
  bordered = false,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        toneStyles[tone],
        spacingStyles[spacing],
        bordered === true && "border-y border-border-subtle",
        bordered === "top" && "border-t border-border-subtle",
        bordered === "bottom" && "border-b border-border-subtle",
        className,
      )}
      {...props}
    />
  );
}
