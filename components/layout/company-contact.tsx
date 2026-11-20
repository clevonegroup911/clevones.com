"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { company } from "@/lib/constants/company";
import { breakUrl } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type CompanyContactProps = {
  location: string;
  /** Full registered office lines; when set, replaces the short location. */
  addressLines?: readonly string[];
  /** Show RCCM and ID Nat. (proof of legal existence). */
  showRegistration?: boolean;
  phoneLabel?: string;
  emailLabel?: string;
  className?: string;
};

export function CompanyContact({
  location,
  addressLines,
  showRegistration = false,
  phoneLabel = "Tel",
  emailLabel = "Email",
  className,
}: CompanyContactProps) {
  return (
    <address className={cn("not-italic", className)}>
      <p className="font-heading text-base font-semibold tracking-tight text-foreground">
        {company.legalName}
      </p>
      {addressLines && addressLines.length > 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {addressLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted">{location}</p>
      )}
      {showRegistration ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="block">
            {company.rccmLabel} {company.rccm}
          </span>
          <span className="block">
            {company.nationalIdLabel} {company.nationalId}
          </span>
        </p>
      ) : null}
      <p className="mt-3 text-sm">
        <span className="text-muted">{phoneLabel}: </span>
        <a
          href={company.phone.href}
          className="text-gray-muted transition-colors hover:text-white focus-visible:rounded-sm focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {company.phone.display}
        </a>
      </p>
      <p className="mt-1.5 text-sm">
        <span className="text-muted">{emailLabel}: </span>
        <a
          href={company.email.href}
          className={cn(
            "text-gray-muted transition-colors hover:text-white focus-visible:rounded-sm focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
            breakUrl,
          )}
        >
          {company.email.display}
        </a>
      </p>
    </address>
  );
}

type CompanyEntityLinkProps = {
  href: string;
  name: string;
  internal?: boolean;
  className?: string;
  children?: ReactNode;
};

export function CompanyEntityLink({
  href,
  name,
  internal = false,
  className,
  children,
}: CompanyEntityLinkProps) {
  const label = children ?? name;

  if (internal) {
    return (
      <Link
        href={href}
        className={className}
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  );
}
