import type { Freshness, SourceStatus } from "@/lib/x200/types";
import type { X200SystemdUnit } from "@/lib/x200/boot/constants";

export type BootOverall =
  | "READY"
  | "DEGRADED"
  | "NOT_INSTALLED"
  | "CONFLICT"
  | "LINGER_REQUIRED";

export type PortOwner = "X200" | "UNKNOWN" | "NONE" | "FREE";

export type PortState =
  | "FREE"
  | "ALREADY_RUNNING"
  | "PORT_3001_CONFLICT"
  | "ERROR";

export type VerifiedFact = {
  id: string;
  label: string;
  value: string | number | boolean | null;
  source: string;
  timestamp: string;
  ageMs: number | null;
  freshness: Freshness;
  verification: "VERIFIED" | "STALE" | "UNVERIFIED" | "NOT_CONNECTED" | "ERROR";
};

export type SystemdUnitSnapshot = {
  unit: X200SystemdUnit;
  status: SourceStatus | "UNAVAILABLE";
  loaded: boolean | null;
  enabled: boolean | null;
  activeState: string | null;
  subState: string | null;
  mainPid: number | null;
  nRestarts: number | null;
  activeEnterTimestamp: string | null;
  execMainStartTimestamp: string | null;
  result: string | null;
  fragmentPath: string | null;
  workingDirectory: string | null;
  warning: string | null;
  source: string;
};

export type DockerDbSnapshot = {
  status: SourceStatus | "UNAVAILABLE";
  dockerAvailable: boolean | null;
  container: string;
  exists: boolean | null;
  running: boolean | null;
  health: string | null;
  restartPolicy: string | null;
  autostartReady: boolean | null;
  warning: string | null;
  source: string;
};

export type LingerSnapshot = {
  status: SourceStatus | "UNAVAILABLE";
  linger: "YES" | "NO" | null;
  lingerRequired: boolean;
  enableCommand: string;
  warning: string | null;
  source: string;
};

export type PortOwnershipSnapshot = {
  status: SourceStatus | "UNAVAILABLE";
  port: number;
  owner: PortOwner;
  state: PortState;
  pid: number | null;
  processName: string | null;
  cmdline: string | null;
  cwd: string | null;
  listenAddress: string | null;
  warning: string | null;
  source: string;
};

export type BrowserAutostartSnapshot = {
  status: SourceStatus | "UNAVAILABLE";
  installed: boolean | null;
  desktopPath: string | null;
  sessionMarkerPresent: boolean | null;
  warning: string | null;
  source: string;
};

export type WatchdogSnapshot = {
  status: SourceStatus | "UNAVAILABLE";
  watchdogStatus: "OK" | "DEGRADED" | "COOLDOWN" | "DISABLED" | "UNKNOWN";
  consecutiveFailures: number;
  recoveryCount: number;
  lastRecovery: string | null;
  cooldownState: "NONE" | "ACTIVE" | "UNKNOWN";
  warning: string | null;
  source: string;
};

export type BootOrchestratorSnapshot = {
  generatedAt: string;
  overall: BootOverall;
  controlCenterUrl: string;
  missing: string[];
  facts: VerifiedFact[];
  controlCenter: SystemdUnitSnapshot;
  autopilot: SystemdUnitSnapshot;
  dockerDb: DockerDbSnapshot;
  linger: LingerSnapshot;
  port: PortOwnershipSnapshot;
  browser: BrowserAutostartSnapshot;
  watchdog: WatchdogSnapshot;
  lastStart: string | null;
  lastFailure: string | null;
  lastRecovery: string | null;
  diagnosticsText: string;
};

export type BootActionId =
  | "START_CONTROL_CENTER"
  | "RESTART_CONTROL_CENTER"
  | "START_AUTOPILOT"
  | "RESTART_AUTOPILOT"
  | "START_DATABASE"
  | "ENABLE_AUTOSTART"
  | "DISABLE_AUTOSTART"
  | "REFRESH_STARTUP_STATUS"
  | "OPEN_CONTROL_CENTER"
  | "COPY_DIAGNOSTICS";

export const BOOT_ACTION_IDS = [
  "START_CONTROL_CENTER",
  "RESTART_CONTROL_CENTER",
  "START_AUTOPILOT",
  "RESTART_AUTOPILOT",
  "START_DATABASE",
  "ENABLE_AUTOSTART",
  "DISABLE_AUTOSTART",
  "REFRESH_STARTUP_STATUS",
  "OPEN_CONTROL_CENTER",
  "COPY_DIAGNOSTICS",
] as const satisfies readonly BootActionId[];
