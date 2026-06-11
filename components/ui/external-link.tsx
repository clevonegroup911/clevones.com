import { type ComponentPropsWithoutRef } from "react";

import { breakUrl, externalDomainLink } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type ExternalLinkProps = ComponentPropsWithoutRef<"a"> & {
  showNewTabHint?: boolean;
};

export function ExternalLink({
  className,
  children,
  showNewTabHint = true,
  target = "_blank",
  rel = "noopener noreferrer",
  ...props
}: ExternalLinkProps) {
  return (
    <a
      className={cn(externalDomainLink, breakUrl, "max-w-full", className)}
      target={target}
      rel={rel}
      {...props}
    >
      {children}
      {showNewTabHint ? (
        <span className="sr-only"> (opens in new tab)</span>
      ) : null}
    </a>
  );
}
