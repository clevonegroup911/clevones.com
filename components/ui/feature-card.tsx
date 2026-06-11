import { type ReactNode } from "react";

import {
  Card,
  CardDescription,
  CardTitle,
  type CardProps,
} from "@/components/ui/card";
import { cardAccentLine, cardGrid3 } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  variant?: CardProps["variant"];
  className?: string;
  leading?: ReactNode;
};

export function FeatureCard({
  title,
  description,
  variant = "elevated",
  className,
  leading,
}: FeatureCardProps) {
  return (
    <Card
      variant={variant}
      padding="md"
      className={cn(
        "group transition-colors hover:border-gold/15",
        className,
      )}
    >
      {leading ?? <div className={cardAccentLine} aria-hidden />}
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </Card>
  );
}

type FeatureCardGridProps = {
  children: ReactNode;
  className?: string;
};

export function FeatureCardGrid({ children, className }: FeatureCardGridProps) {
  return <div className={cn(cardGrid3, className)}>{children}</div>;
}
