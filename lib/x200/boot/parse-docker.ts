/**
 * Pure Docker inspect / restart-policy parsers — CI-safe.
 */

export type ParsedDockerInspect = {
  exists: boolean;
  running: boolean;
  status: string | null;
  health: string | null;
  restartPolicy: string | null;
  name: string | null;
  id: string | null;
};

export function parseDockerInspectJson(raw: unknown): ParsedDockerInspect {
  if (!Array.isArray(raw) || raw.length === 0) {
    return {
      exists: false,
      running: false,
      status: null,
      health: null,
      restartPolicy: null,
      name: null,
      id: null,
    };
  }
  const first = raw[0] as Record<string, unknown>;
  const state = (first.State ?? {}) as Record<string, unknown>;
  const hostConfig = (first.HostConfig ?? {}) as Record<string, unknown>;
  const restart = (hostConfig.RestartPolicy ?? {}) as Record<string, unknown>;
  const healthObj = state.Health as Record<string, unknown> | undefined;

  const nameRaw = typeof first.Name === "string" ? first.Name : null;
  const name = nameRaw ? nameRaw.replace(/^\//, "") : null;

  return {
    exists: true,
    running: state.Running === true,
    status: typeof state.Status === "string" ? state.Status : null,
    health:
      healthObj && typeof healthObj.Status === "string"
        ? healthObj.Status
        : null,
    restartPolicy:
      typeof restart.Name === "string" && restart.Name.length > 0
        ? restart.Name
        : "no",
    name,
    id: typeof first.Id === "string" ? first.Id.slice(0, 12) : null,
  };
}

export function isDbAutostartReady(
  restartPolicy: string | null,
  target = "unless-stopped",
): boolean {
  return restartPolicy === target || restartPolicy === "always";
}

/** Parse `docker info` failure vs success for availability. */
export function parseDockerAvailability(exitCode: number): boolean {
  return exitCode === 0;
}
