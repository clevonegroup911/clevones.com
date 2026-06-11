import { createPageMetadata } from "@/lib/metadata";

import { GovernancePageContent } from "@/components/sections/governance-page";

export const metadata = createPageMetadata({
  title: "Governance",
  description:
    "Governance, compliance, and controlled collaboration at Clevones — structure, documentation, accountability, and neutral coordination for territorial economic initiatives.",
  path: "/governance",
});

export default function GovernancePage() {
  return <GovernancePageContent />;
}
