import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const sizeStyles = {
  default: "max-w-6xl",
  prose: "max-w-3xl",
  wide: "max-w-7xl",
  full: "max-w-full",
} as const;

type ContainerSize = keyof typeof sizeStyles;

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  size?: ContainerSize;
  /** Apply horizontal page gutters (mobile-first). */
  padded?: boolean;
};

export function Container({
  className,
  size = "default",
  padded = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        sizeStyles[size],
        padded && "px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}
