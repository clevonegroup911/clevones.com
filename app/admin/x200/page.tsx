import { createPageMetadata } from "@/lib/metadata";

import { ControlCenterClient } from "@/app/admin/x200/control-center-client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getControlCenterSnapshot } from "@/lib/x200/control-center";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "X200 Control Center",
  description:
    "Supervision X200 — backlog, Git, CI, Human Gates. Lecture seule, sources réelles.",
  path: "/admin/x200",
  robots: { index: false, follow: false },
});

export default async function AdminX200ControlCenterPage() {
  await requireAdmin();
  const snapshot = await getControlCenterSnapshot();

  return <ControlCenterClient snapshot={snapshot} />;
}
