import { headers } from "next/headers";

export async function getRequestAuditContext() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    null;
  const userAgent = headerStore.get("user-agent");

  return {
    ipAddress,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
  };
}
