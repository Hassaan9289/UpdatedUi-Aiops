'use client';

import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AGENT_ORG_KEY } from "@/config/agent";
import { AGENT_API_BASE } from "@/config/api";
import { formatCurrentTime, useAgents } from "@/lib/useAgents";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

const agentStatusVariant: Record<string, "success" | "warning"> = {
  healthy: "success",
  warning: "warning",
};

const apiFallbackAgentTypes = [
  { code: "SA", name: "Server Agent" },
  { code: "TA", name: "Ticketing Agent" },
  { code: "MA", name: "Mail Agent" },
  { code: "AA", name: "Apps Agent" },
];
const staticEnterprises = ["Mule", "SAP", "ERP Next", "MQ Server", "ACE", "Salesforce"];
const normalizeEnterpriseEntry = (entry: unknown): string => {
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry !== null) {
    if ("name" in entry && typeof (entry as any).name === "string") {
      return (entry as any).name;
    }
    if ("enterprise" in entry && typeof (entry as any).enterprise === "string") {
      return (entry as any).enterprise;
    }
    if ("org" in entry && typeof (entry as any).org === "string") {
      return (entry as any).org;
    }
  }
  return String(entry);
};
type AgentTypeOption = (typeof apiFallbackAgentTypes)[number];
type ActionOption = {
  action_code: string;
  action_name: string;
};
type CredentialField = { field: string; type: string; label: string };
const llmOptions = ["Groq"];

export default function AgentManagementPage() {
  const { agents, performAgentAction, addAgent } = useAgents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [agentTypes, setAgentTypes] = useState<AgentTypeOption[]>(apiFallbackAgentTypes);
  const [selectedAgentType, setSelectedAgentType] = useState<AgentTypeOption | null>(null);
  const [agentTypeOptionsLoading, setAgentTypeOptionsLoading] = useState(false);
  const [enterpriseOptions, setEnterpriseOptions] = useState(staticEnterprises);
  const [enterprise, setEnterprise] = useState("");
  const [enterprisesLoading, setEnterprisesLoading] = useState(false);
  const [availableActions, setAvailableActions] = useState<ActionOption[]>([]);
  const [selectedActions, setSelectedActions] = useState<ActionOption[]>([]);
  const [availableSelection, setAvailableSelection] = useState<string[]>([]);
  const [selectedSelection, setSelectedSelection] = useState<string[]>([]);
  const [credentialFields, setCredentialFields] = useState<CredentialField[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const handleCredentialChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };
  const [wizardStep, setWizardStep] = useState(1);
  const [llmModel, setLlmModel] = useState(llmOptions[0]);
  const [serverUrl, setServerUrl] = useState("");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [enableServerUrl, setEnableServerUrl] = useState(false);
  const [enableServerCert, setEnableServerCert] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successActive, setSuccessActive] = useState(false);
  const [successProgress, setSuccessProgress] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type" | "lastModified" | "port" | "status">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) =>
        agent.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      ),
    [agents, searchTerm],
  );
  const sortedAgents = useMemo(() => {
    const copy = [...filteredAgents];
    const directionFactor = sortDirection === "asc" ? 1 : -1;
    const getSortValue = (agent: (typeof filteredAgents)[number]) => {
      switch (sortBy) {
        case "name":
          return agent.name.toLowerCase();
        case "type":
          return (agent.type || "agent").toLowerCase();
        case "status":
          return agent.running ? 1 : 0;
        case "port":
          return agent.running && agent.port ? agent.port : Number.MAX_SAFE_INTEGER;
        case "lastModified": {
          const ts = new Date(agent.lastActionTime).getTime();
          return Number.isFinite(ts) ? ts : 0;
        }
        default:
          return agent.name.toLowerCase();
      }
    };
    copy.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * directionFactor;
      }
      return String(av).localeCompare(String(bv)) * directionFactor;
    });
    return copy;
  }, [filteredAgents, sortBy, sortDirection]);
  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (selectedAgentType) {
      localStorage.setItem("selectedAgentType", selectedAgentType.code);
    } else {
      localStorage.removeItem("selectedAgentType");
    }
  }, [selectedAgentType]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (enterprise) {
      localStorage.setItem("selectedEnterprise", enterprise);
    } else {
      localStorage.removeItem("selectedEnterprise");
    }
  }, [enterprise]);
  const handleSubmit = async () => {
    if (!newAgentName.trim()) {
      setErrorMessage("Agent name is required.");
      return;
    }
    if (!selectedAgentType) {
      setErrorMessage("Agent type is required.");
      return;
    }
    if (!enterprise.trim()) {
      setErrorMessage("Enterprise is required.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    const payload = {
      orgKey: AGENT_ORG_KEY,
      agentName: newAgentName.trim(),
      agentType: selectedAgentType.code,
      subType: enterprise,
      credentials,
      actions: selectedActions.map((action) => action.action_code),
    };
    console.log("Create agent request", payload);
    try {
      const response = await fetch(`${AGENT_API_BASE}/create`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Unable to create agent");
      }
      const data = await response.json();
      console.log("Create agent response", data);
      setSuccessMessage("Agent Created Successfully");
      setSuccessActive(true);
      setSuccessProgress(100);
      const createdAgentId = data.agentId ?? data.id ?? undefined;
      const createdAgentPort = data.port ?? null;
      console.log("Create agent response port", createdAgentPort);
      addAgent({
        name: newAgentName.trim(),
        zone: enterprise,
        status: "healthy",
        running: false,
        type: selectedAgentType?.name ?? "Agent",
        lastActionTime: formatCurrentTime(),
        agentId: createdAgentId,
        port: createdAgentPort,
      });
      setIsModalOpen(false);
      setNewAgentName("");
      setSelectedAgentType(null);
      setEnterpriseOptions(staticEnterprises);
      setEnterprise("");
      setAvailableActions([]);
      setSelectedActions([]);
      setAvailableSelection([]);
      setSelectedSelection([]);
      setCredentialFields([]);
      setCredentials({});
      setLlmModel(llmOptions[0]);
      setServerUrl("");
      setCertificate(null);
      setEnableServerUrl(false);
      setEnableServerCert(false);
      setWizardStep(1);
    } catch (error) {
      console.error("Create agent error", error);
      setErrorMessage("Unable to create agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAgentName = async () => {
    setIsValidatingName(true);
    try {
      const response = await fetch(`${AGENT_API_BASE}/validate`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgKey: AGENT_ORG_KEY,
          agentName: newAgentName.trim(),
        }),
      });
      if (!response.ok) {
        setErrorMessage("Unable to validate agent name.");
        return false;
      }
      const data = await response.json();
      console.log("Agent validation response", data);
      if (!data.valid) {
        setErrorMessage(data.message ?? "Invalid agent name.");
        return false;
      }
      setErrorMessage(null);
      if (typeof window !== "undefined") {
        localStorage.setItem("newAgentName", newAgentName.trim());
      }
      return true;
    } catch (err) {
      console.error("Validation error", err);
      setErrorMessage("Unable to validate agent name.");
      return false;
    } finally {
      setIsValidatingName(false);
    }
  };

  const fetchAgentTypes = useCallback(async () => {
    setAgentTypeOptionsLoading(true);
    try {
      const response = await fetch(`${AGENT_API_BASE}/types?orgKey=${AGENT_ORG_KEY}`, {
        headers: {
          accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Unable to load agent types");
      }
      const data = await response.json();
      console.log("Agent types response", data);
      if (Array.isArray(data.agentTypes) && data.agentTypes.length > 0) {
        setAgentTypes(data.agentTypes);
      } else {
        setAgentTypes(apiFallbackAgentTypes);
      }
    } catch (error) {
      console.error("Error fetching agent types", error);
      setAgentTypes(apiFallbackAgentTypes);
    } finally {
      setAgentTypeOptionsLoading(false);
    }
  }, []);

  const fetchEnterpriseOptions = useCallback(async (agentTypeCode: string | null) => {
    setEnterprisesLoading(true);
    if (!agentTypeCode) {
      setEnterpriseOptions(staticEnterprises);
      setEnterprise("");
      setAvailableActions([]);
      setSelectedActions([]);
      setEnterprisesLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${AGENT_API_BASE}/subtypes?agentType=${agentTypeCode}&orgKey=${AGENT_ORG_KEY}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Unable to load enterprise options");
      }
      const data = await response.json();
      console.log("Enterprise options response", data);
      console.log("Agent list response", data);
      const rawOffers = Array.isArray(data.enterprises)
        ? data.enterprises
        : Array.isArray(data.agents)
        ? data.agents
        : staticEnterprises;
      const offers = rawOffers.map(normalizeEnterpriseEntry);
      setEnterpriseOptions(offers);
      setEnterprise("");
    } catch (error) {
      console.error("Error fetching enterprise options", error);
      setEnterpriseOptions(staticEnterprises);
      setEnterprise("");
    } finally {
      setEnterprisesLoading(false);
    }
  }, []);

  const handleAgentTypeChange = (code: string) => {
    if (!code) {
      setSelectedAgentType(null);
      setEnterprise("");
      fetchEnterpriseOptions(null);
      return;
    }
    const next = agentTypes.find((type) => type.code === code) ?? null;
    console.log("Selected agent type code", code);
    setSelectedAgentType(next);
    setEnterprise("");
    fetchEnterpriseOptions(next?.code ?? null);
  };

  const fetchActions = useCallback(async () => {
    if (!selectedAgentType || !enterprise) {
      setAvailableActions([]);
      setSelectedActions([]);
      return;
    }
    try {
      const response = await fetch(
        `${AGENT_API_BASE}/actions?subType=${enterprise}&orgKey=${AGENT_ORG_KEY}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Unable to load actions");
      }
      const data = await response.json();
      console.log("Actions response", data);
      const incoming: ActionOption[] = Array.isArray(data.actions) ? data.actions : [];
      setAvailableActions(incoming);
      setSelectedActions([]);
      setAvailableSelection([]);
      setSelectedSelection([]);
    } catch (error) {
      console.error("Error fetching actions", error);
      setAvailableActions([]);
      setSelectedActions([]);
      setAvailableSelection([]);
      setSelectedSelection([]);
    }
  }, [selectedAgentType, enterprise]);

  const fetchCredentialSchema = useCallback(async () => {
    if (!selectedAgentType || !enterprise) {
      setCredentialFields([]);
      setCredentials({});
      return;
    }
    try {
      const response = await fetch(
        `${AGENT_API_BASE}/credential-schema?subType=${enterprise}&orgKey=${AGENT_ORG_KEY}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Unable to load credential schema");
      }
      const data = await response.json();
      console.log("Credential schema response", data);
      const schema =
        Array.isArray(data.schema) && data.schema.length > 0 ? data.schema : [];
      setCredentialFields(schema);
      setCredentials(
        schema.reduce((acc: Record<string, string>, field: CredentialField) => {
          acc[field.field] = "";
          return acc;
        }, {} as Record<string, string>),
      );
    } catch (error) {
      console.error("Error fetching credential schema", error);
      setCredentialFields([]);
      setCredentials({});
    }
  }, [selectedAgentType, enterprise]);

  const moveToSelected = () => {
    const moving = availableActions.filter((action) => availableSelection.includes(action.action_code));
    setSelectedActions((prev) => [...prev, ...moving]);
    setAvailableActions((prev) => prev.filter((action) => !availableSelection.includes(action.action_code)));
    setAvailableSelection([]);
  };

  const moveToAvailable = () => {
    const moving = selectedActions.filter((action) => selectedSelection.includes(action.action_code));
    setAvailableActions((prev) => [...prev, ...moving]);
    setSelectedActions((prev) => prev.filter((action) => !selectedSelection.includes(action.action_code)));
    setSelectedSelection([]);
  };

  const goToNextStep = async () => {
    if (wizardStep === 1) {
      if (!newAgentName.trim()) {
        setErrorMessage("Agent name is required.");
        return;
      }
      const isValid = await validateAgentName();
      if (!isValid) {
        return;
      }
      setWizardStep(2);
      return;
    }
    setErrorMessage(null);
    setWizardStep((prev) => Math.min(3, prev + 1));
  };

  const goToPrevStep = () => {
    setErrorMessage(null);
    setWizardStep((prev) => Math.max(1, prev - 1));
  };

  const isNextDisabled =
    (wizardStep === 1 && (!newAgentName.trim() || isValidatingName)) ||
    (wizardStep === 2 && (!selectedAgentType || !enterprise.trim()));

  const openModal = () => {
    setWizardStep(1);
    setErrorMessage(null);
    setLlmModel(llmOptions[0]);
    setSelectedAgentType(null);
    setEnterpriseOptions(staticEnterprises);
    setEnterprise("");
    setAgentTypes(apiFallbackAgentTypes);
    setAvailableActions([]);
    setSelectedActions([]);
    setAvailableSelection([]);
    setSelectedSelection([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage(null);
    setWizardStep(1);
    setLlmModel(llmOptions[0]);
    setSelectedAgentType(null);
    setEnterpriseOptions(staticEnterprises);
    setEnterprise("");
  };

  const isServerUrlInvalid = enableServerUrl && !serverUrl.trim();
  const isServerCertInvalid = enableServerCert && !certificate;
  const isSubmitDisabled = isServerUrlInvalid || isServerCertInvalid;
  const submitDisabled = isSubmitDisabled || isSubmitting;

  useEffect(() => {
    if (!successActive) {
      return;
    }
    const duration = 3000;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.max(0, 100 - (elapsed / duration) * 100);
      setSuccessProgress(next);
      if (next === 0) {
        clearInterval(interval);
        setSuccessActive(false);
        setSuccessMessage(null);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [successActive]);

  useEffect(() => {
    if (isModalOpen) {
      fetchAgentTypes();
    }
  }, [isModalOpen, fetchAgentTypes]);

  useEffect(() => {
    if (wizardStep === 3) {
      fetchActions();
      fetchCredentialSchema();
    } else {
      setAvailableActions([]);
      setSelectedActions([]);
      setCredentialFields([]);
      setCredentials({});
      setAvailableSelection([]);
      setSelectedSelection([]);
    }
  }, [wizardStep, fetchActions, fetchCredentialSchema]);

  const [confirmAction, setConfirmAction] = useState<{
    agentName: string;
    type: "start" | "stop";
  } | null>(null);

  const toggleAgent = (agentName: string, type: "start" | "stop") => {
    setConfirmAction({ agentName, type });
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction) return;
    const target = agents.find((agent) => agent.name === confirmAction.agentName);
    if (!target?.agentId) {
      setConfirmAction(null);
      return;
    }
    await performAgentAction(target.agentId, confirmAction.type);
    setConfirmAction(null);
  };

  const serverFields = useMemo(
    () => (
      <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-inner">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Server endpoint</p>
          <span className="text-[11px] text-slate-400">Each connection piece can be enabled individually.</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span>Server URL</span>
            <input
              className={`mt-2 w-full min-w-0 rounded-2xl border border-slate-200/80 px-4 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none ${
                enableServerUrl
                  ? "bg-white text-slate-800"
                  : "bg-slate-300 text-white placeholder:text-white/70"
              }`}
              placeholder="https://example.com"
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value)}
              disabled={!enableServerUrl}
            />
            <label className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-slate-300 bg-white text-indigo-500 focus:ring-indigo-500"
                checked={enableServerUrl}
                onChange={(event) => setEnableServerUrl(event.target.checked)}
              />
              Enable
            </label>
          </label>
          <label className="space-y-2 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span>Server certificate</span>
            <div className="flex">
              <input
                className={`mt-2 w-full rounded-2xl border border-slate-200/80 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed ${
                  enableServerCert
                    ? "bg-white text-slate-700"
                    : "bg-slate-300 text-white placeholder:text-white/70"
                }`}
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (enableServerCert) {
                    setCertificate(file);
                  }
                }}
                disabled={!enableServerCert}
              />
            </div>
            <label className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-slate-300 bg-white text-indigo-500 focus:ring-indigo-500"
                checked={enableServerCert}
                onChange={(event) => setEnableServerCert(event.target.checked)}
              />
              Enable
            </label>
          </label>
        </div>
      </div>
    ),
    [certificate, serverUrl, enableServerCert, enableServerUrl],
  );

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator"]}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px]">
              <p className="section-title">Agent management</p>
              <p className="text-sm text-white/60">Lifecycle, versioning, and health of deployed agents.</p>
            </div>
            <div className="flex flex-1 min-w-[240px] justify-center">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-200/80 bg-white/80 px-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_6px_20px_rgba(15,23,42,0.05)] focus:border-slate-400 focus:outline-none"
                  placeholder="Search Agent"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <div className="flex min-w-[200px] justify-end">
              <Button variant="default" className="px-5 py-3 text-sm font-medium tracking-[0.15em]" onClick={openModal}>
                + Create new agent
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Total agents</p>
              <p className="text-2xl font-semibold">{agents.length}</p>
              <p className="text-xs text-emerald-200">+2 new this week</p>
            </Card>
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Online</p>
              <p className="text-2xl font-semibold">{agents.filter((a) => a.running).length}</p>
              <p className="text-xs text-emerald-200">All healthy</p>
            </Card>
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Offline</p>
              <p className="text-2xl font-semibold">{agents.filter((a) => !a.running).length}</p>
              <p className="text-xs text-rose-200">Review connectivity</p>
            </Card>
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Avg. start port</p>
              <p className="text-2xl font-semibold">
                {(() => {
                  const ports = agents.filter((a) => a.running && a.port).map((a) => a.port as number);
                  if (!ports.length) return "—";
                  const avg = Math.round(ports.reduce((s, p) => s + p, 0) / ports.length);
                  return avg;
                })()}
              </p>
              <p className="text-xs text-white/70">Sample static metric</p>
            </Card>
          </div>
          {successMessage && successActive && (
            <div className="pointer-events-none fixed right-6 bottom-6 flex max-w-sm px-4">
              <div className="flex max-w-sm items-center justify-between rounded-2xl border border-emerald-200/60 bg-white/90 px-4 py-3 text-sm text-emerald-600 shadow-lg">
                <span>{successMessage}</span>
                <div className="ml-2 h-2 w-20 rounded-full border border-emerald-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${successProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <Card className="overflow-hidden border border-slate-200/80 bg-white/90 text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.08)] mt-2">
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-4 py-3 text-left">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-slate-600"
                        onClick={() => toggleSort("name")}
                      >
                        Name {sortBy === "name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("type")}
                      >
                        Type {sortBy === "type" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("lastModified")}
                      >
                        Last Modified {sortBy === "lastModified" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("port")}
                      >
                        Port {sortBy === "port" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("status")}
                      >
                        Status {sortBy === "status" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-slate-800">
                  {sortedAgents.map((agent) => {
                    const statusLabel = agent.running ? "Online" : "Offline";
                    const portLabel = agent.running && agent.port ? agent.port : "Agent Not Started";
                    return (
                      <tr key={agent.name} className="bg-white/85 transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 uppercase">
                              {agent.name.slice(0, 2)}
                            </span>
                            <span className="font-semibold text-slate-900">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700">{agent.type || "Agent"}</td>
                        <td className="px-4 py-3 text-center text-slate-700">
                          {agent.running ? "Started at " : "Stopped at "}
                          {agent.lastActionTime}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700">{portLabel}</td>
                        <td className="px-4 py-3 text-center text-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                agent.running ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                            <span>{statusLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="inline-flex items-center gap-2 rounded-sm bg-red-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white shadow-[0_6px_14px_rgba(244,67,54,0.25)] hover:bg-red-600"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m-3 0h12" />
                            </svg>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No agents match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
        {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-slate-200/70 bg-slate-100/80 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.25)] backdrop-blur py-8">
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-600/90">Create agent</p>
                  <h2 className="text-3xl font-semibold text-slate-900">Connect your new intelligence</h2>
                </div>
                <button
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
              <Card className="mt-6 rounded-[26px] border border-slate-200/80 bg-slate-100 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.15)] max-h-[calc(100vh-8rem)] overflow-hidden">
                <div className="flex h-full flex-col space-y-6">
                  <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
                    <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Step {wizardStep} of 3</p>
                    <h3 className="text-2xl font-semibold text-slate-900">
                      {wizardStep === 1
                        ? "Name your agent"
                        : wizardStep === 2
                        ? "Configure the agent experience"
                        : "Authorize the integrations"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {wizardStep === 1
                        ? "Give your agent a name that reflects its role."
                        : wizardStep === 2
                        ? "Pick the type, enterprise, and LLM to back it."
                        : "Provide credentials and optional server information."}
                    </p>
                  </div>
                  {wizardStep === 1 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-600">Agent name</label>
                      <input
                        className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                        placeholder="Enter agent name"
                        value={newAgentName}
                        onChange={(event) => setNewAgentName(event.target.value)}
                      />
                    </div>
                  )}
                  {wizardStep === 2 && (
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-slate-500">
                          Agent type
                          <select
                            className="mt-2 w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            value={selectedAgentType?.code ?? ""}
                            onChange={(event) => handleAgentTypeChange(event.target.value)}
                          >
                          <option value="">
                            Select agent type
                          </option>
                            {agentTypes.map((agentTypeOption) => (
                              <option key={agentTypeOption.code} value={agentTypeOption.code}>
                                {agentTypeOption.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-slate-500">
                          Enterprise
                          <select
                            className={`mt-2 w-full rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
                              !selectedAgentType || enterprisesLoading
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                : "bg-white text-slate-900"
                            }`}
                            value={enterprise}
                            onChange={(event) => setEnterprise(event.target.value)}
                            disabled={!selectedAgentType || enterprisesLoading}
                          >
                            <option value="">Select enterprise</option>
                            {enterpriseOptions.map((entry) => (
                              <option key={entry} value={entry}>
                                {entry}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="text-sm font-medium text-slate-500">
                        LLM
                        <select
                          className="mt-2 w-full rounded-2xl border border-slate-200/80 bg-slate-200 px-4 py-3 text-sm text-slate-500 focus:border-indigo-500 focus:outline-none cursor-not-allowed"
                          value={llmModel}
                          onChange={(event) => setLlmModel(event.target.value)}
                          disabled
                        >
                          {llmOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {wizardStep === 3 && (availableActions.length > 0 || selectedActions.length > 0) && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 text-sm text-slate-800 shadow-inner">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Available actions</p>
                        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
                          <div className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Available values</p>
                            <select
                              multiple
                              size={5}
                              value={availableSelection}
                              onChange={(event) =>
                                setAvailableSelection(
                                  Array.from(event.target.selectedOptions, (opt) => opt.value),
                                )
                              }
                              className="h-32 min-h-[120px] w-full overflow-y-auto rounded-md border border-slate-200/70 bg-white px-2 py-1 text-sm text-slate-800 outline-none"
                            >
                              {availableActions.map((action) => (
                                <option key={action.action_code} value={action.action_code}>
                                  {action.action_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!availableSelection.length}
                              onClick={moveToSelected}
                            >
                              &gt;&gt;
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!selectedSelection.length}
                              onClick={moveToAvailable}
                            >
                              &lt;&lt;
                            </button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Selected values</p>
                            <select
                              multiple
                              size={5}
                              value={selectedSelection}
                              onChange={(event) =>
                                setSelectedSelection(
                                  Array.from(event.target.selectedOptions, (opt) => opt.value),
                                )
                              }
                              className="h-32 min-h-[120px] w-full overflow-y-auto rounded-md border border-slate-200/70 bg-white px-2 py-1 text-sm text-slate-800 outline-none"
                            >
                              {selectedActions.map((action) => (
                                <option key={action.action_code} value={action.action_code}>
                                  {action.action_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      {credentialFields.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Credentials</p>
                            <span className="text-[11px] text-slate-400">Populated from backend schema</span>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {credentialFields.map((field) => (
                              <label key={field.field} className="text-sm font-medium text-slate-500">
                                {field.label}
                                <Input
                                  className="mt-2"
                                  type={
                                    field.type === "password"
                                      ? "password"
                                      : field.type === "number"
                                      ? "number"
                                      : "text"
                                  }
                                  placeholder={field.label}
                                  value={credentials[field.field] ?? ""}
                                  onChange={(event) => handleCredentialChange(field.field, event.target.value)}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {serverFields}
                    </div>
                  )}
                  {errorMessage && (
                    <p className="rounded-xl border border-rose-200/60 bg-rose-50/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-rose-600">
                      {errorMessage}
                    </p>
                  )}
                  </div>
                </div>
              </Card>
              <div className="mt-6 flex items-center justify-between gap-3">
                {wizardStep > 1 ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="px-6 py-2 text-sm border border-white/70"
                    onClick={goToPrevStep}
                  >
                    Prev
                  </Button>
                ) : (
                  <div />
                )}
                {wizardStep < 3 ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="px-6 py-2 text-sm"
                      disabled={isNextDisabled}
                      style={
                        isNextDisabled
                          ? {
                              backgroundImage: "none",
                              backgroundColor: "#d4ceff",
                              color: "#312e81",
                              boxShadow: "none",
                            }
                          : undefined
                      }
                      onClick={goToNextStep}
                    >
                      Next
                    </Button>
                ) : (
                  <Button
                    size="sm"
                    className="px-6 py-2 text-sm"
                    variant="default"
                    disabled={submitDisabled}
                    style={
                      submitDisabled
                        ? {
                            backgroundImage: "none",
                            backgroundColor: "rgb(226 232 240)",
                            color: "rgb(71 85 105)",
                            boxShadow: "none",
                          }
                        : undefined
                    }
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-[28px] border border-white/30 bg-white/95 p-6 shadow-[0_25px_45px_rgba(15,23,42,0.35)]">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Confirm action</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {confirmAction.type === "start" ? "Start" : "Stop"}
                </h3>
                <p className="text-sm text-slate-600">
                  {confirmAction.type === "start"
                    ? "You are about to start the agent, which will initiate background processes."
                    : "Stopping the agent will suspend its integrations until next restart."}
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleConfirmToggle}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </RequireRole>
    </AuthGate>
  );
}
