'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { connectors } from "@/lib/mockData";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Activity, ArrowRight, Logs, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const leftNav = [
  { id: "all", label: "Connectors", hint: "List view" },
  { id: "add", label: "Add Connector", hint: "Create new connection" },
  { id: "status", label: "Connection Status", hint: "Health overview" },
  { id: "logs", label: "Connector Logs", hint: "Sync & error history" },
];

const sampleTableConnectors = [
  { name: "Prometheus", category: "Monitoring", status: "connected", lastSync: "5 mins ago", actions: ["Edit", "Test"] },
  { name: "ELK Stack", category: "Monitoring", status: "error", lastSync: "20 mins ago", actions: ["Retry"] },
  { name: "ServiceNow", category: "Ticketing", status: "connected", lastSync: "2 hrs ago", actions: ["Edit"] },
  { name: "Slack", category: "Collaboration", status: "connecting", lastSync: "-", actions: ["Cancel"] },
];

const statusTone: Record<string, "success" | "warning" | "danger"> = {
  connected: "success",
  warning: "warning",
  error: "danger",
  connecting: "warning",
};

const logEntries = [
  { id: "log-01", time: "10:22 AM", message: "Prometheus heartbeat validated (220ms)", type: "sync" },
  { id: "log-02", time: "09:58 AM", message: "ServiceNow incident creation handshake succeeded", type: "sync" },
  { id: "log-03", time: "09:35 AM", message: "ELK Stack API returned 504 (retry scheduled)", type: "error" },
  { id: "log-04", time: "09:12 AM", message: "Slack OAuth refresh pending", type: "warning" },
];

const steps = ["Connector Details", "Authentication", "Configuration", "Review & Test"];

const samplePayload = {
  name: "Prometheus",
  type: "Monitoring",
  authType: "APIKey",
  config: {
    endpoint: "https://prometheus-server/api",
    apiKey: "******",
  },
};

const createInitialFormState = () => ({
  name: "Prometheus",
  type: "Monitoring",
  authType: "API Key",
  credential: "vault://aiops/prometheus",
  clientId: "",
  clientSecret: "",
  username: "",
  password: "",
  endpoint: "https://prometheus-server/api",
  mapping: "eventType=anomaly,index=aiops,queue=alerts",
  enableSync: true,
});

export default function AIOpsConnectorPage() {
  const [activeTab, setActiveTab] = useState<"all" | "add" | "logs">("all");
  const connectedCount = useMemo(() => connectors.filter((connector) => connector.status === "connected").length, []);
  const staleCount = connectors.length - connectedCount;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(createInitialFormState);
  const canAdvance = useMemo(() => {
    if (step === 0) {
      return form.name.trim().length > 0 && form.type.length > 0;
    }
    if (step === 1) {
      if (form.authType === "API Key") {
        return form.credential.trim().length > 0;
      }
      if (form.authType === "OAuth") {
        return form.clientId.trim().length > 0 && form.clientSecret.trim().length > 0;
      }
      if (form.authType === "Basic Auth") {
        return form.username.trim().length > 0 && form.password.trim().length > 0;
      }
      return false;
    }
    if (step === 2) {
      return form.endpoint.trim().length > 0;
    }
    return true;
  }, [form, step]);

  const toggleEnableSync = () => setForm((f) => ({ ...f, enableSync: !f.enableSync }));

  const handleNext = () => {
    if (step < steps.length - 1 && canAdvance) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const resetWizard = useCallback(() => {
    setStep(0);
    setForm(createInitialFormState());
  }, []);

  useEffect(() => {
    if (activeTab === "add") {
      resetWizard();
    }
  }, [activeTab, resetWizard]);

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator"]}>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <Card className="space-y-3 border border-[var(--border)] bg-[var(--card-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Navigation layout</p>
              <div className="space-y-2">
                {leftNav.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition",
                        activeTab === item.id
                          ? "bg-[var(--card)] text-[var(--text)]"
                          : "text-[var(--muted)] hover:bg-white/5",
                      )}
                      onClick={() => {
                        if (item.id === "status") {
                          setActiveTab("all");
                        } else {
                          setActiveTab(item.id as "all" | "add" | "logs");
                        }
                      }}
                    >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-widest">{item.hint}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Connection status</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--text)]">
                <p>
                  <span className="font-semibold">{connectedCount}</span> connectors streaming telemetry.
                </p>
                <p>
                  <span className="font-semibold">{staleCount}</span> need resync or credentials review.
                </p>
                <div className="flex gap-2 text-xs text-[var(--muted)]">
                  <span className="border border-white/20 px-2 py-1">Healthy</span>
                  <span className="border border-white/20 px-2 py-1">Pending</span>
                  <span className="border border-white/20 px-2 py-1">Errors</span>
                </div>
              </div>
            </Card>

          </aside>

          <section className="space-y-6">
            <Card className="border border-[var(--border)] bg-[var(--card-muted)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">AIops connector</p>
                  <h1 className="text-3xl font-semibold text-[var(--text)]">Unified observability bridge</h1>
                </div>
                <div className="flex gap-2 text-sm text-[var(--muted)]">
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                    View audit trail
                  </Button>
                  <Button variant="muted" size="sm">
                  <Logs className="h-4 w-4" />
                    Recent syncs
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                Royal Cyber AIOps keeps telemetry, incidents, and runbooks synchronized over managed connectors.
                Administrators can view connector health, run analytics, and orchestrate new connections from a single control plane.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/80">
                <span className="flex items-center gap-2 border border-[var(--border)] px-3 py-1">
                  <Activity className="h-4 w-4" />
                  {connectedCount} connected
                </span>
                <span className="flex items-center gap-2 border border-[var(--border)] px-3 py-1">
                  <Plus className="h-4 w-4" />
                  {staleCount} pending sync
                </span>
              </div>
            </Card>

            <Card className="space-y-4 border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-4 border-b border-[var(--border)] pb-3">
                {["All connectors", "Add Connector", "Logs"].map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wide transition",
                      activeTab === tab.toLowerCase().split(" ")[0]
                        ? "text-[var(--text)]"
                        : "text-[var(--muted)]",
                    )}
                    onClick={() =>
                      setActiveTab(tab === "All connectors" ? "all" : tab === "Add Connector" ? "add" : "logs")
                    }
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "all" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-[var(--border)] bg-[var(--card-muted)]">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-white/5 text-[var(--muted)]">
                        <tr className="text-left text-xs uppercase tracking-widest">
                          <th className="px-4 py-3">Connector</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Last sync</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleTableConnectors.map((connector) => (
                          <tr key={connector.name} className="border-b border-white/5 last:border-none">
                            <td className="px-4 py-4 text-[var(--text)] font-medium">{connector.name}</td>
                            <td className="px-4 py-4 text-[var(--muted)]">{connector.category}</td>
                            <td className="px-4 py-4">
                              <Badge variant={statusTone[connector.status] ?? "default"}>
                                {connector.status === "connecting" ? "Connecting" : connector.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-[var(--muted)]">{connector.lastSync}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                {connector.actions.map((action) => (
                                  <Button key={action} variant="ghost" size="sm">
                                    {action}
                                  </Button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Connector table summarizes type, status, and last sync cadence. Pending retries and cancels can be batch automated from the automation catalog.
                  </p>
                </div>
              )}

              {activeTab === "add" && (
                <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-[var(--muted)]">
                  {steps.map((label, index) => {
                    const isActive = index === step;
                    return (
                      <button
                        key={label}
                        className={cn(
                          "flex items-center gap-2 border px-3 py-1 text-xs uppercase tracking-widest transition",
                          isActive
                            ? "border-white bg-gradient-to-r from-indigo-600/90 to-purple-600/80 text-white shadow-[0_0_18px_rgba(79,70,229,0.5)]"
                            : "border-white/20 bg-transparent text-[var(--muted)]",
                        )}
                        onClick={() => setStep(index)}
                        type="button"
                      >
                        <span className="text-[11px]">{index + 1}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>

                  {step === 0 && (
                    <div className="grid gap-4 md:grid-cols-[1.6fr_1fr] items-end">
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-widest text-[var(--muted)]">Connector name</span>
                        <Input
                          value={form.name}
                          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder="e.g., Prometheus"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-widest text-[var(--muted)]">Type</span>
                        <Select
                          value={form.type}
                          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                          className="w-full"
                        >
                          <option>Monitoring</option>
                          <option>Automation</option>
                          <option>Ticketing</option>
                          <option>Collaboration</option>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Auth type</label>
                        <Select
                          value={form.authType}
                          onChange={(event) => setForm((current) => ({ ...current, authType: event.target.value }))}
                        >
                          <option>API Key</option>
                          <option>OAuth</option>
                          <option>Basic Auth</option>
                        </Select>
                      </div>

                      {form.authType === "API Key" && (
                        <div>
                          <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Credential / vault link</label>
                          <Input
                            type="password"
                            value={form.credential}
                            onChange={(event) => setForm((current) => ({ ...current, credential: event.target.value }))}
                            placeholder="vault://..."
                          />
                          <p className="mt-2 text-[11px] text-[var(--muted)]">
                            Encrypted with AES256. Refresh token can be rotated without downtime.
                          </p>
                        </div>
                      )}

                      {form.authType === "OAuth" && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Client ID</label>
                            <Input
                              value={form.clientId}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, clientId: event.target.value }))
                              }
                              placeholder="OAuth client ID"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Client Secret</label>
                            <Input
                              type="password"
                              value={form.clientSecret}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, clientSecret: event.target.value }))
                              }
                              placeholder="OAuth client secret"
                            />
                          </div>
                        </div>
                      )}

                      {form.authType === "Basic Auth" && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Username</label>
                            <Input
                              value={form.username}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, username: event.target.value }))
                              }
                              placeholder="Username"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Password</label>
                            <Input
                              type="password"
                              value={form.password}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, password: event.target.value }))
                              }
                              placeholder="Password"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Endpoint URL</label>
                        <Input
                          value={form.endpoint}
                          onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))}
                          placeholder="https://<connector>/api"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Data mapping</label>
                        <Input
                          value={form.mapping}
                          onChange={(event) => setForm((current) => ({ ...current, mapping: event.target.value }))}
                          placeholder="eventType=..."
                        />
                        <p className="mt-2 text-[11px] text-[var(--muted)]">
                          e.g. <code>eventType=anomaly,index=aiops,queue=alerts</code>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)]">Enable sync</label>
                        <button
                          type="button"
                          className={cn(
                            "border px-3 py-1 text-sm transition",
                            form.enableSync ? "border-emerald-400 text-emerald-300" : "border-white/20 text-[var(--muted)]",
                          )}
                          onClick={toggleEnableSync}
                        >
                          {form.enableSync ? "Enabled" : "Disabled"}
                        </button>
                        <span className="text-[10px] text-[var(--muted)]">Control sync cadence here.</span>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                      <Card className="border border-dashed border-white/10 bg-transparent p-4 text-sm text-[var(--muted)]">
                      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Review payload</p>
                      <pre className="mt-2 max-h-52 overflow-auto bg-black/30 p-3 text-xs text-white">
                        {JSON.stringify(
                          {
                            ...samplePayload,
                            name: form.name,
                            type: form.type,
                            authType: form.authType,
                            config: {
                              ...samplePayload.config,
                              endpoint: form.endpoint,
                              mapping: form.mapping,
                              enableSync: form.enableSync,
                            },
                          },
                          null,
                          2,
                        )}
                      </pre>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="muted" size="sm">
                          Test connection
                        </Button>
                        <Button variant="default" size="sm">
                          Create connector
                        </Button>
                      </div>
                    </Card>
                  )}

                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <Button variant="ghost" size="sm" disabled={step === 0} onClick={handleBack}>
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={resetWizard}>
                        Reset
                      </Button>
                      <Button variant="default" size="sm" onClick={handleNext} disabled={!canAdvance || step === steps.length - 1}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-3">
                  {logEntries.map((entry) => (
                    <Card key={entry.id} className="flex items-center justify-between border border-[var(--border)] bg-[var(--card-muted)] p-4">
                      <div>
                        <p className="text-sm text-[var(--text)]">{entry.message}</p>
                        <p className="text-xs text-[var(--muted)]">{entry.time}</p>
                      </div>
                      <Badge variant={entry.type === "error" ? "danger" : entry.type === "warning" ? "warning" : "default"}>
                        {entry.type.toUpperCase()}
                      </Badge>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

          </section>
        </div>
      </RequireRole>
    </AuthGate>
  );
}
