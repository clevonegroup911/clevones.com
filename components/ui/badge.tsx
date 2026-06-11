import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-navy-subtle text-navy",
  gold: "bg-gold-subtle text-navy",
  navy: "bg-navy text-white",
  outline: "border border-border-subtle bg-transparent text-navy-muted",
} as const;

type BadgeVariant = keyof typeof variantStyles;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold tracking-[0.15em] uppercase",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
