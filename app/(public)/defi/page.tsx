import { ChallengePageSection } from "@/components/sections/challenge-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.challenge.meta,
  path: "/defi",
  locale: "fr",
  pageKey: "challenge",
  hrefLang: true,
});

export default function DefiPage() {
  return <ChallengePageSection />;
}
