import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type CtaButtonGroupProps = {
  children: ReactNode;
  className?: string;
  align?: "start" | "center";
};

export function CtaButtonGroup({
  children,
  className,
  align = "start",
}: CtaButtonGroupProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center",
        align === "center" && "sm:justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
