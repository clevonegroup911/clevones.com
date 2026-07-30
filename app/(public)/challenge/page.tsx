import { ChallengePageSection } from "@/components/sections/challenge-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.challenge.meta,
  path: "/challenge",
  locale: "en",
  pageKey: "challenge",
  hrefLang: true,
});

export default function ChallengePage() {
  return <ChallengePageSection />;
}
