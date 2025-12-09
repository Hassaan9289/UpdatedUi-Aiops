'use client';

import { useCallback, useEffect, useState } from "react";
import { AGENT_ORG_KEY } from "@/config/agent";
import { AGENT_API_BASE } from "@/config/api";

const AGENT_LIST_URL = `${AGENT_API_BASE}/list?orgKey=${AGENT_ORG_KEY}`;
const AGENT_ACTION_BASE = AGENT_API_BASE;

export type AgentSummary = {
  agentId: number;
  name: string;
  zone: string;
  status: "healthy" | "warning";
  running: boolean;
  type: string;
  enterprise?: string | null;
  version?: string;
  lastActionTime: string;
  port?: number | null;
};

type AgentApiItem = {
  agentId: number;
  name: string;
  zone?: string;
  status?: string;
  subType?: string;
  enterprise?: string;
  agentType?: string;
  type?: string;
  version?: string;
  port?: number;
};

type AgentOverride = {
  running: boolean;
  port?: number | null;
};

const STORAGE_KEY = "aiops-agent-overrides";

export const formatCurrentTime = () => {
  const now = new Date();
  return now.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const toAgentSummary = (agent: AgentApiItem): AgentSummary => ({
  agentId: agent.agentId,
  name: agent.name ?? "Unknown agent",
  zone: agent.zone ?? "N/A",
  status: agent.status === "RUNNING" ? "healthy" : "warning",
  running: agent.status === "RUNNING",
  type: agent.subType ?? agent.agentType ?? agent.type ?? "Agent",
  enterprise: agent.enterprise ?? agent.subType ?? null,
  version: agent.version ?? "v1.0.0",
  lastActionTime: formatCurrentTime(),
  port: agent.port ?? null,
});

const loadOverrides = (): Record<number, AgentOverride> => {
  if (typeof window === "undefined") {
    return {};
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

const saveOverrides = (overrides: Record<number, AgentOverride>) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
};

export const useAgents = () => {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<number, AgentOverride>>(() => loadOverrides());

  const removeOverride = useCallback((agentId: number) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[agentId];
      saveOverrides(next);
      return next;
    });
  }, []);

  const applyOverride = useCallback(
    (agent: AgentSummary): AgentSummary => {
      const override = overrides[agent.agentId];
      if (!override) {
        return agent;
      }
      return {
        ...agent,
        running: override.running,
        status: override.running ? "healthy" : "warning",
        port: override.port ?? agent.port,
      };
    },
    [overrides],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(AGENT_LIST_URL, {
        headers: {
          accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Unable to load agent list");
      }
      const data = await response.json();
      if (Array.isArray(data.agents)) {
        setAgents(data.agents.map(toAgentSummary).map(applyOverride));
        return;
      }
      setAgents([]);
    } catch (err) {
      console.error("Error fetching agent list", err);
      setError(err instanceof Error ? err.message : "Unable to load agent list");
    } finally {
      setLoading(false);
    }
  }, [applyOverride]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateOverride = useCallback((agentId: number, running: boolean, port: number | null = null) => {
    setOverrides((prev) => {
      const next = {
        ...prev,
        [agentId]: {
          running,
          port: port ?? prev[agentId]?.port ?? null,
        },
      };
      saveOverrides(next);
      return next;
    });
  }, []);

  const performAgentAction = useCallback(
    async (agentId: number, action: "start" | "stop") => {
      const endpoint = action === "start" ? "start" : "stop";
      try {
        const response = await fetch(`${AGENT_ACTION_BASE}/${endpoint}?agentId=${agentId}`, {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Unable to ${action} agent`);
        }
        const data = await response.json();
        console.log(`${action} agent response`, data);
        const serverPort = data?.port ?? null;
        setAgents((prev) =>
          prev.map((agent) =>
            agent.agentId === agentId
              ? {
                  ...agent,
                  running: action === "start",
                  status: action === "start" ? "healthy" : "warning",
                  lastActionTime: formatCurrentTime(),
                  port: serverPort ?? agent.port,
                }
              : agent,
          ),
        );
        updateOverride(agentId, action === "start", action === "start" ? serverPort ?? null : null);
      } catch (err) {
        console.error(`${action} agent error`, err);
      }
    },
    [updateOverride],
  );

  const deleteAgent = useCallback(
    async (agentId: number) => {
      try {
        const response = await fetch(`${AGENT_ACTION_BASE}/delete/${agentId}`, {
          method: "DELETE",
          headers: {
            accept: "application/json",
          },
        });
        const data = await response
          .json()
          .catch(() => null);
        console.log("Delete agent response", data);
        if (!response.ok) {
          throw new Error("Unable to delete agent");
        }
        setAgents((prev) => prev.filter((agent) => agent.agentId !== agentId));
        removeOverride(agentId);
      } catch (err) {
        console.error("Delete agent error", err);
        throw err;
      }
    },
    [removeOverride],
  );

  const addAgent = useCallback(
    (agent: Omit<AgentSummary, "agentId"> & { agentId?: number; port?: number | null }) => {
      setAgents((prev) => [
        {
          agentId: agent.agentId ?? Date.now(),
          name: agent.name,
          zone: agent.zone,
          status: agent.status,
          running: agent.running,
          type: agent.type,
          enterprise: agent.enterprise ?? null,
          port: agent.port ?? null,
          version: agent.version,
          lastActionTime: agent.lastActionTime ?? formatCurrentTime(),
        },
        ...prev,
      ]);
    },
    [],
  );

  return {
    agents,
    loading,
    error,
    refresh,
    performAgentAction,
    addAgent,
    deleteAgent,
  };
};
