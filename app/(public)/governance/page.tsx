import { createPageMetadata } from "@/lib/metadata";

import { GovernancePageContent } from "@/components/sections/governance-page";

export const metadata = createPageMetadata({
  title: "Governance",
  description:
    "Governance, compliance and controlled collaboration in CLEVONE coordination missions — structure, documentation, accountability and neutral coordination.",
  path: "/governance",
});

export default function GovernancePage() {
  return <GovernancePageContent />;
}
