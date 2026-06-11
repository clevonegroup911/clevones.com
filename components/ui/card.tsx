import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const variantStyles = {
  default: "border border-border-subtle bg-surface",
  elevated: "border border-border-subtle bg-surface-elevated shadow-sm",
  outlined: "border border-border bg-transparent",
  muted: "border border-border-subtle bg-surface-muted",
} as const;

const paddingStyles = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-7 lg:p-8",
  lg: "p-6 sm:p-8 lg:p-10",
} as const;

type CardVariant = keyof typeof variantStyles;
type CardPadding = keyof typeof paddingStyles;

export type CardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-sm",
        variantStyles[variant],
        paddingStyles[padding],
        className,
      )}
      {...props}
    />
  );
}

type CardHeaderProps = ComponentPropsWithoutRef<"div">;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn("mb-4", className)} {...props} />;
}

type CardTitleProps = ComponentPropsWithoutRef<"h3">;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl",
        className,
      )}
      {...props}
    />
  );
}

type CardDescriptionProps = ComponentPropsWithoutRef<"p">;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("mt-2 text-sm leading-relaxed text-muted", className)}
      {...props}
    />
  );
}
