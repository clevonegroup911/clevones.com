/**
 * Pure linger parser for `loginctl show-user … -p Linger`.
 */

export type ParsedLinger = {
  linger: "YES" | "NO" | null;
  lingerRequired: boolean;
};

export function parseLingerOutput(stdout: string): ParsedLinger {
  const map = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  const raw = (map.get("Linger") ?? "").toLowerCase();
  if (raw === "yes" || raw === "true" || raw === "1") {
    return { linger: "YES", lingerRequired: false };
  }
  if (raw === "no" || raw === "false" || raw === "0") {
    return { linger: "NO", lingerRequired: true };
  }
  return { linger: null, lingerRequired: true };
}

export function lingerEnableCommand(user: string): string {
  const safe = user.replace(/[^a-zA-Z0-9._-]/g, "") || "$USER";
  return `sudo loginctl enable-linger "${safe}"`;
}
