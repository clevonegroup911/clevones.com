import { DEFAULT_AGENT_CATALOG } from "@/lib/agentic/catalog";
import {
  AGENT_PROVIDER_IDS,
  type AgentCapability,
  type AgentProviderAdapter,
  type AgentProviderId,
  type AgentStatus,
} from "@/lib/agentic/types";

export type LiveProviderCallResult = {
  ok: false;
  code: "PROVIDER_LIVE_DISABLED";
  message: string;
};

export type StubProviderId = AgentProviderId | "future";

export type StubProviderAdapter = Omit<AgentProviderAdapter, "id"> & {
  readonly id: StubProviderId;
  /** Live inference is disabled until an owner-authorized key/provider is configured. */
  execute(taskType: string, input?: Record<string, unknown>): Promise<LiveProviderCallResult>;
  stream(taskType: string, input?: Record<string, unknown>): Promise<LiveProviderCallResult>;
};

const LIVE_DISABLED: LiveProviderCallResult = {
  ok: false,
  code: "PROVIDER_LIVE_DISABLED",
  message: "Live provider calls are disabled — no network, no paid SDK",
};

function capabilitiesForProvider(id: AgentProviderId): readonly AgentCapability[] {
  const caps = new Set<AgentCapability>();
  for (const agent of DEFAULT_AGENT_CATALOG) {
    if (agent.provider === id) {
      for (const c of agent.capabilities) caps.add(c);
    }
  }
  return [...caps];
}

function baseCost(id: AgentProviderId): number {
  const agents = DEFAULT_AGENT_CATALOG.filter((a) => a.provider === id);
  if (agents.length === 0) return 1;
  return Math.min(...agents.map((a) => a.estimatedCostPerTask));
}

function createStub(id: AgentProviderId): StubProviderAdapter {
  const capabilities = capabilitiesForProvider(id);
  const costFloor = baseCost(id);

  return {
    id,
    async healthCheck() {
      // Pure local check — never opens a socket or imports a vendor SDK.
      return { ok: true, status: "available" satisfies AgentStatus };
    },
    getCapabilities() {
      return capabilities;
    },
    estimateCost(taskType: string) {
      const weight = taskType.includes("review") || taskType.includes("code") ? 1.5 : 1;
      return Math.round(costFloor * weight * 100) / 100;
    },
    async execute() {
      return { ...LIVE_DISABLED };
    },
    async stream() {
      return { ...LIVE_DISABLED };
    },
  };
}

export function isAgentProviderId(value: string): value is AgentProviderId {
  return (AGENT_PROVIDER_IDS as readonly string[]).includes(value);
}

/**
 * Factory for provider adapters. No vendor SDK, no network.
 * `future` stays a reserved stub with empty capabilities.
 */
export function createProviderAdapter(id: StubProviderId): StubProviderAdapter {
  if (!isAgentProviderId(id) && id !== "future") {
    throw new Error(`UNKNOWN_PROVIDER:${String(id)}`);
  }
  if (id === "future") {
    return {
      id: "future",
      async healthCheck() {
        return { ok: true, status: "available" };
      },
      getCapabilities() {
        return [];
      },
      estimateCost() {
        return 0;
      },
      async execute() {
        return { ...LIVE_DISABLED };
      },
      async stream() {
        return { ...LIVE_DISABLED };
      },
    };
  }
  return createStub(id);
}

export function listStubProviderIds(): readonly StubProviderId[] {
  return AGENT_PROVIDER_IDS;
}
