/**
 * Once-per-desktop-session browser open marker logic.
 */

import { createHash } from "node:crypto";

export const BROWSER_SESSION_MARKER_PREFIX = "x200-browser-opened-";

export function browserSessionMarkerName(bootId: string): string {
  const digest = createHash("sha256").update(bootId).digest("hex").slice(0, 16);
  return `${BROWSER_SESSION_MARKER_PREFIX}${digest}`;
}

export type BrowserOpenDecision =
  | { open: true; reason: "FIRST_OPEN" }
  | { open: false; reason: "ALREADY_OPENED_THIS_SESSION" | "CONTROL_CENTER_UNAVAILABLE" | "TIMEOUT" };

/**
 * Decide whether to open the browser for this graphical session.
 * Marker presence ⇒ skip (no duplicate tabs on refresh/restart).
 */
export function decideBrowserOpen(input: {
  markerExists: boolean;
  controlCenterReachable: boolean;
  timedOut: boolean;
}): BrowserOpenDecision {
  if (input.markerExists) {
    return { open: false, reason: "ALREADY_OPENED_THIS_SESSION" };
  }
  if (input.timedOut) {
    return { open: false, reason: "TIMEOUT" };
  }
  if (!input.controlCenterReachable) {
    return { open: false, reason: "CONTROL_CENTER_UNAVAILABLE" };
  }
  return { open: true, reason: "FIRST_OPEN" };
}

/** Fixed argv for xdg-open — never shell, never arbitrary URL. */
export function xdgOpenFixedArgs(url: string): {
  file: string;
  args: readonly string[];
} {
  if (url !== "http://127.0.0.1:3001/admin/x200") {
    throw new Error("REFUSED — only CONTROL_CENTER_URL is allowed");
  }
  return {
    file: "xdg-open",
    args: [url] as const,
  };
}
