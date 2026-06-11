import type { Viewport } from "next";
import { Libre_Franklin, Source_Sans_3 } from "next/font/google";
import { headers } from "next/headers";

import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { getHtmlLang, getLocaleFromHeaders } from "@/lib/i18n";
import { rootMetadata } from "@/lib/metadata";

import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: "swap",
});

export const metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0d12",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocaleFromHeaders(await headers());

  return (
    <html
      lang={getHtmlLang(locale)}
      className={`${sourceSans.variable} ${libreFranklin.variable}`}
    >
      <body className="min-h-screen">
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );
}
