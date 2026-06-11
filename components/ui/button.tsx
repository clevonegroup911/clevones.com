import Link from "next/link";
import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-white hover:bg-navy-hover focus-visible:ring-gold/40",
  secondary:
    "bg-gold text-charcoal hover:bg-gold-hover focus-visible:ring-gold/50",
  ghost:
    "text-gray-muted hover:bg-white/5 hover:text-white focus-visible:ring-gold/30",
  outline:
    "border border-border-subtle bg-transparent text-foreground hover:border-gold/30 hover:bg-white/5 focus-visible:ring-gold/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-11 min-h-11 px-4 text-sm",
  md: "h-11 min-h-11 px-6 text-sm",
  lg: "h-12 min-h-12 px-6 text-sm sm:px-8 sm:text-base",
};

const baseStyles =
  "inline-flex touch-manipulation items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal disabled:pointer-events-none disabled:opacity-50";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
