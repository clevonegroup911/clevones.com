import { redirect } from "next/navigation";

import { adminRoutes } from "@/lib/auth";

export default function AdminIndexPage() {
  redirect(adminRoutes.dashboard);
}
