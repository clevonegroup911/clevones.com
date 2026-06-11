import Link from "next/link";
import { type ComponentPropsWithoutRef } from "react";

import { textLink } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type TextLinkProps = ComponentPropsWithoutRef<typeof Link>;

export function TextLink({ className, children, ...props }: TextLinkProps) {
  return (
    <Link className={cn(textLink, className)} {...props}>
      {children}
    </Link>
  );
}
