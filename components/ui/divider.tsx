import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-border-subtle",
  gold: "bg-gold",
  navy: "bg-navy",
  subtle: "bg-border-subtle/60",
} as const;

type DividerVariant = keyof typeof variantStyles;

type DividerProps = ComponentPropsWithoutRef<"hr"> & {
  variant?: DividerVariant;
  /** Institutional accent rule (short horizontal mark). */
  accent?: boolean;
  label?: string;
};

export function Divider({
  className,
  variant = "default",
  accent = false,
  label,
  ...props
}: DividerProps) {
  if (label) {
    return (
      <div
        className={cn("flex items-center gap-4", className)}
        role="separator"
      >
        <hr
          className={cn("h-px flex-1 border-0", variantStyles[variant])}
          {...props}
        />
        <span className="shrink-0 text-xs font-semibold tracking-[0.15em] text-muted uppercase">
          {label}
        </span>
        <hr
          className={cn("h-px flex-1 border-0", variantStyles[variant])}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        "border-0",
        accent ? "h-px w-12" : "h-px w-full",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
