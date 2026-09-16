import type { FactCell, MirrorFreshness, VerificationState } from "@/lib/x200/mirror/types";

export function formatAgeLabel(ageMs: number | null): string | null {
  if (ageMs === null || !Number.isFinite(ageMs)) return null;
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return `${min}m ${rem}s ago`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hours}h ${remMin}m ago`;
}

export function ageMsFromIso(iso: string | null | undefined, nowMs: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, nowMs - t);
}

export function freshnessFromAge(
  ageMs: number | null,
  staleMs: number,
  base: MirrorFreshness = "live",
): MirrorFreshness {
  if (ageMs === null) return "unavailable";
  if (ageMs > staleMs) return "stale";
  return base;
}

export function fact(input: {
  id: string;
  label: string;
  value: string | number | boolean | null;
  source: string;
  timestamp: string | null;
  ageMs?: number | null;
  freshness: MirrorFreshness;
  verification: VerificationState;
  note?: string | null;
}): FactCell {
  const ageMs = input.ageMs ?? ageMsFromIso(input.timestamp, Date.now());
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    source: input.source,
    timestamp: input.timestamp,
    freshness: input.freshness,
    ageMs,
    ageLabel: formatAgeLabel(ageMs),
    verification: input.verification,
    note: input.note ?? null,
  };
}

export function displayFactValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
