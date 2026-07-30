import { headers } from "next/headers";

import { getContent, getLocaleFromHeaders } from "@/lib/i18n";

export async function getLocaleContent() {
  const locale = getLocaleFromHeaders(await headers());
  const content = getContent(locale);

  return { locale, content, pages: content.pages };
}
