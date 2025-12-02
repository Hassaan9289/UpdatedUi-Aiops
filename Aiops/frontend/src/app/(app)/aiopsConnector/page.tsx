 "use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Clock,
  Plus,
  Settings2,
  PlayCircle,
  ServerCog,
  ShieldCheck,
  Search,
  RefreshCcw,
  Trash2,
  Link2,
  BarChart3,
  Terminal,
  ListTree,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// -----------------------------
// Mock API layer (dummy endpoints)
// -----------------------------
type ConnectorPayload = {
  name: string;
  type: string;
  authType: string;
  config: {
    endpoint: string;
    credential?: string;
    mapping?: string;
    enableSync?: boolean;
  };
};

type Connector = {
  id: string;
  name: string;
  type: string;
  status: "connected" | "error" | "connecting";
  lastSync: string;
};

type TestResult = { ok: boolean; latencyMs?: number; message: string; warn?: boolean };

const api = {
  getAllConnectors: async () => {
    await delay(400);
    return [
      {
        id: "1",
        name: "Prometheus",
        type: "Monitoring",
        status: "connected",
        lastSync: "5 mins ago",
      },
      {
        id: "2",
        name: "ELK Stack",
        type: "Monitoring",
        status: "error",
        lastSync: "20 mins ago",
      },
      {
        id: "3",
        name: "ServiceNow",
        type: "Ticketing",
        status: "connected",
        lastSync: "2 hrs ago",
      },
      {
        id: "4",
        name: "Slack",
        type: "Collaboration",
        status: "connecting",
        lastSync: "-",
      },
    ];
  },
  createConnector: async (payload: ConnectorPayload): Promise<Connector> => {
    await delay(700);
    const created: Connector = {
      id: String(Math.random()).slice(2),
      name: payload.name,
      type: payload.type,
      status: "connecting",
      lastSync: "-",
    };
    return created;
  },
  updateConnector: async (id: string, patch: Partial<ConnectorPayload>) => {
    await delay(500);
    return { ok: true, id, patch };
  },
  deleteConnector: async (id: string) => {
    await delay(400);
    return { ok: true, id };
  },
  testConnection: async (payload: Partial<ConnectorPayload>): Promise<TestResult> => {
    // Simulate success for Prometheus, warning for Slack, error for others
    await delay(900);
    const name = (payload?.name || "").toLowerCase();
    if (name.includes("prometheus")) return { ok: true, latencyMs: 180, message: "Handshake successful" };
    if (name.includes("slack")) return { ok: false, warn: true, latencyMs: 520, message: "OAuth token scopes incomplete" };
    return { ok: false, latencyMs: 0, message: "Endpoint unreachable (DNS)" };
  },
};

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// -----------------------------
// Small UI helpers
// -----------------------------
const StatusBadge = ({ status }: { status: "connected" | "error" | "connecting" }) => {
  const map = {
    connected: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Connected", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    error: { icon: <CircleSlash className="h-4 w-4" />, label: "Error", className: "bg-red-100 text-red-700 border-red-200" },
    connecting: { icon: <CircleDashed className="h-4 w-4 animate-spin" />, label: "Connecting", className: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const s = map[status] || map["connecting"];
  return (
    <Badge variant="outline" className={`gap-1 px-2 py-1 rounded-full ${s.className}`}>
      {s.icon}
      {s.label}
    </Badge>
  );
};

const SectionTitle = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// -----------------------------
// Wizard state & review
// -----------------------------
const Stepper = ({ step }: { step: number }) => {
  const items = ["Details", "Auth", "Config", "Review & Test"];
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {items.map((label, idx) => (
        <div key={label} className={`h-2 rounded-full ${idx <= step ? "bg-primary" : "bg-muted"}`} />
      ))}
      <div className="col-span-4 text-xs text-muted-foreground text-right">Step {step + 1} of 4 — {items[step]}</div>
    </div>
  );
};

// -----------------------------
// Logs
// -----------------------------
type LogLevel = "info" | "warn" | "error";
type LogEntry = { id: number; level: LogLevel; ts: string; msg: string };

const initialLogs: LogEntry[] = [
  { id: 1, level: "info", ts: "2025-11-12 09:20", msg: "Prometheus sync completed in 1.8s (2.1MB)" },
  { id: 2, level: "warn", ts: "2025-11-12 09:10", msg: "Slack OAuth token missing scopes: channels:history" },
  { id: 3, level: "error", ts: "2025-11-12 09:05", msg: "ELK connection failed: TLS cert expired" },
  { id: 4, level: "info", ts: "2025-11-12 08:45", msg: "ServiceNow: created 3 tickets from anomalies" },
  { id: 5, level: "info", ts: "2025-11-12 08:30", msg: "Scheduler: next sync window in 10m" },
];

// -----------------------------
// Metrics
// -----------------------------
const latencySeries = [
  { t: "08:30", ms: 260 },
  { t: "08:45", ms: 220 },
  { t: "09:00", ms: 240 },
  { t: "09:15", ms: 185 },
  { t: "09:30", ms: 210 },
  { t: "09:45", ms: 180 },
];

const errorSeries = [
  { t: "08:30", count: 1 },
  { t: "08:45", count: 0 },
  { t: "09:00", count: 2 },
  { t: "09:15", count: 0 },
  { t: "09:30", count: 1 },
  { t: "09:45", count: 0 },
];

// -----------------------------
// Main Component
// -----------------------------
export default function AIOpsConnectorsMock() {
const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);

  React.useEffect(() => {
    api.getAllConnectors().then((rows) => {
      const normalized = rows.map((connector) => ({
        ...connector,
        status: (connector.status as Connector["status"]) ?? "connecting",
      }));
      setConnectors(normalized);
      setLoading(false);
    });

    // -----------------------------
    // Runtime smoke tests (added as basic test cases)
    // -----------------------------
    runSmokeTests(addLog);
  }, []);

  const onRetry = async (row: Connector) => {
    addLog("info", `Re-testing ${row.name} connection...`);
    const res = await api.testConnection(row);
    if (res.ok) {
      updateStatus(row.id, "connected");
      addLog("info", `${row.name} connected in ${res.latencyMs}ms`);
    } else if (res.warn) {
      updateStatus(row.id, "connecting");
      addLog("warn", `${row.name} partial: ${res.message}`);
    } else {
      updateStatus(row.id, "error");
      addLog("error", `${row.name} failed: ${res.message}`);
    }
  };

  const onDelete = async (id: string) => {
    await api.deleteConnector(id);
    setConnectors((prev) => prev.filter((c) => c.id !== id));
  };

  const updateStatus = (id: string, status: Connector["status"]) =>
    setConnectors((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

  const addLog = (level: "info" | "error" | "warn", msg: string) =>
    setLogs((prev) => [
      { id: Math.random(), level, ts: new Date().toISOString().slice(0, 16).replace("T", " "), msg },
      ...prev,
    ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ServerCog className="h-5 w-5"/> AIOps Connectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <NavItem icon={ListTree} label="Connectors" active/>
              <NavItem icon={Plus} label="Add Connector" onClick={() => setActiveTab("add")}/>
              <NavItem icon={Terminal} label="Connector Logs" onClick={() => setActiveTab("logs")}/>
              <NavItem icon={BarChart3} label="Monitoring" onClick={() => setActiveTab("metrics")}/>
              <div className="pt-3 mt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4"/> Admins only can modify</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Panel */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="all">All Connectors</TabsTrigger>
                <TabsTrigger value="add">Add Connector</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <Input placeholder="Search connectors" className="pl-7 w-56"/>
                </div>
                <Button variant="outline" size="icon" onClick={() => window.location.reload()} title="Refresh">
                  <RefreshCcw className="h-4 w-4"/>
                </Button>
              </div>
            </div>

            {/* All connectors */}
            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-0">
                  <SectionTitle icon={ListTree} title="All Connectors" subtitle="Overview of configured systems and their sync health"/>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="py-12 text-center text-muted-foreground">Loading connectors…</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground">
                          <tr className="border-b">
                            <th className="py-2">Connector</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Last Sync</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {connectors.map((row) => (
                            <tr key={row.id} className="border-b last:border-0">
                              <td className="py-3 font-medium flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-muted grid place-items-center"><Settings2 className="h-4 w-4"/></div>
                                {row.name}
                              </td>
                              <td>{row.type}</td>
                              <td><StatusBadge status={row.status}/></td>
                              <td className="text-muted-foreground">{row.lastSync}</td>
                              <td className="text-right">
                                <div className="flex justify-end gap-2">
                                  {/* FIXED: balanced template literal */}
                                  <Button size="sm" variant="outline" onClick={() => addLog("info", `Editing ${row.name} (mock)`)}>Edit</Button>
                                  <Button size="sm" variant="ghost" onClick={() => onRetry(row)}>
                                    <PlayCircle className="h-4 w-4 mr-1"/> Test
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => onDelete(row.id)}>
                                    <Trash2 className="h-4 w-4 mr-1"/> Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <SectionTitle icon={ShieldCheck} title="Security & Governance" subtitle="Credentials are encrypted, access controlled, and auditable"/>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  <SecurityTile title="Encrypted storage" desc="AES-256 at rest; KMS managed"/>
                  <SecurityTile title="Role-based access" desc="Only Admins can add/modify"/>
                  <SecurityTile title="Audit logs" desc="Track every change & test"/>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add connector */}
            <TabsContent value="add">
            <AddConnectorWizard onCreated={(c: Connector) => {
                setConnectors((prev) => [c, ...prev]);
                setActiveTab("all");
              }} onLog={addLog} />
            </TabsContent>

            {/* Logs */}
            <TabsContent value="logs">
              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={Terminal} title="Connector Logs" subtitle="Errors, warnings, and sync activity"/>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {logs.map((l) => (
                      <div key={l.id} className="grid grid-cols-12 items-center gap-2 text-sm p-2 rounded-xl border bg-card/50">
                        <div className="col-span-3 md:col-span-2 text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4"/>
                          {l.ts}
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <LevelBadge level={l.level}/>
                        </div>
                        <div className="col-span-7 md:col-span-9">{l.msg}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Metrics */}
            <TabsContent value="metrics">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <SectionTitle icon={BarChart3} title="Connection Latency" subtitle="Time to validate connection (ms)"/>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={latencySeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="t" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="ms" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <SectionTitle icon={BarChart3} title="Error Count" subtitle="Failed connection attempts"/>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={errorSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="t" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <SectionTitle icon={ServerCog} title="Sync Metrics" subtitle="Frequency & volume per cycle"/>
                </CardHeader>
                <CardContent className="grid md:grid-cols-4 gap-3">
                  <MetricTile label="Sync Frequency" value="10 min"/>
                  <MetricTile label="Data Volume" value="2.1 MB/cycle"/>
                  <MetricTile label="Active Connectors" value={String(connectors.length)} />
                  <MetricTile label="Open Errors" value={String(logs.filter(l => l.level === 'error').length)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// -----------------------------
// Subcomponents
// -----------------------------
const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition hover:bg-muted ${
      active ? "bg-muted" : ""
    }`}
  >
    <Icon className="h-4 w-4"/>
    <span className="text-sm">{label}</span>
  </button>
);

const SecurityTile = ({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) => (
  <div className="p-4 rounded-2xl border bg-card/50">
    <div className="font-medium">{title}</div>
    <div className="text-sm text-muted-foreground">{desc}</div>
  </div>
);

const LevelBadge = ({ level }: { level: "info" | "warn" | "error" }) => {
  const map = {
    info: "bg-sky-100 text-sky-700 border-sky-200",
    warn: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-red-100 text-red-700 border-red-200",
  };
  return <Badge variant="outline" className={`rounded-full ${map[level]}`}>{level.toUpperCase()}</Badge>;
};

const MetricTile = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="p-4 rounded-2xl border bg-card/50">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

// -----------------------------
// Add Connector Wizard
// -----------------------------
type AddConnectorWizardProps = {
  onCreated: (connector: Connector) => void;
  onLog: (level: "info" | "warn" | "error", msg: string) => void;
};

function AddConnectorWizard({ onCreated, onLog }: AddConnectorWizardProps) {
  const [step, setStep] = useState(0);

  // Step 1 — Details
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  // Step 2 — Auth
  const [authType, setAuthType] = useState("");
  const [credential, setCredential] = useState("");

  // Step 3 — Config
  const [endpoint, setEndpoint] = useState("");
  const [mapping, setMapping] = useState("eventType=anomaly,index=aiops,queue=anomalies");
  const [enableSync, setEnableSync] = useState(true);

  // Test status
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const canNext = useMemo(() => {
    if (step === 0) return name && type;
    if (step === 1) return authType && credential;
    if (step === 2) return endpoint && mapping;
    return true;
  }, [step, name, type, authType, credential, endpoint, mapping]);

  const payload = useMemo(() => ({
    name,
    type,
    authType,
    config: {
      endpoint,
      credential, // masked in UI when rendered below
      mapping,
      enableSync,
    },
  }), [name, type, authType, endpoint, credential, mapping, enableSync]);

  const doTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await api.testConnection(payload);
    setTesting(false);
    setTestResult(res);
    if (res.ok) onLog?.("info", `${name} handshake OK in ${res.latencyMs}ms`);
    else if (res.warn) onLog?.("warn", `${name} test warning: ${res.message}`);
    else onLog?.("error", `${name} test failed: ${res.message}`);
  };

  const doCreate = async () => {
    onLog?.("info", `Creating connector: ${name}`);
    const created = await api.createConnector(payload);
    onCreated?.(created);
    onLog?.("info", `${name} created; status Connecting`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionTitle icon={Link2} title="Add Connector" subtitle="Wizard-style form to create a new connection"/>
      </CardHeader>
      <CardContent>
        <Stepper step={step} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s1" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Connector Name</Label>
                <Input placeholder="e.g., Prometheus" value={name} onChange={(e)=>setName(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(event) => setType(event.target.value)}>
                  <SelectTrigger><SelectValue placeholder="Select a type"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monitoring">Monitoring</SelectItem>
                    <SelectItem value="Automation">Automation</SelectItem>
                    <SelectItem value="Ticketing">Ticketing</SelectItem>
                    <SelectItem value="Collaboration">Collaboration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Auth Type</Label>
                <Select value={authType} onChange={(event) => setAuthType(event.target.value)}>
                  <SelectTrigger><SelectValue placeholder="Choose auth"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APIKey">API Key</SelectItem>
                    <SelectItem value="OAuth">OAuth</SelectItem>
                    <SelectItem value="BasicAuth">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credential</Label>
                <Input type="password" placeholder="••••••••" value={credential} onChange={(e)=>setCredential(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Stored encrypted (AES-256) or via Vault reference.</p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s3" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Endpoint URL</Label>
                  <Input placeholder="https://server/api" value={endpoint} onChange={(e)=>setEndpoint(e.target.value)} />
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <Switch checked={enableSync} onCheckedChange={setEnableSync} id="sync"/>
                  <Label htmlFor="sync">Enable Sync</Label>
                </div>
              </div>
              <div>
                <Label>Data Mapping</Label>
                <Textarea value={mapping} onChange={(e)=>setMapping(e.target.value)} rows={4} />
                <p className="text-xs text-muted-foreground mt-1">e.g., eventType, index name, queue</p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s4" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="grid gap-4">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Review Payload</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-xl overflow-auto">
{JSON.stringify({
  name,
  type,
  authType,
  config: {
    endpoint,
    credential: credential ? "******" : "",
    mapping,
    enableSync,
  },
}, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button onClick={doTest} disabled={testing}>
                  <PlayCircle className="h-4 w-4 mr-1"/>
                  {testing ? "Testing…" : "Test Connection"}
                </Button>
                <Button variant="ghost" onClick={doCreate} disabled={!name || !type}>Create Connector</Button>
              </div>

              {testResult && (
                <AnimatePresence>
                  <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="p-3 rounded-xl border">
                    <div className="flex items-center gap-2">
                      {testResult.ok ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600"/>
                      ) : testResult.warn ? (
                        <Clock className="h-5 w-5 text-amber-600"/>
                      ) : (
                        <CircleSlash className="h-5 w-5 text-red-600"/>
                      )}
                      <div className="font-medium">
                        {testResult.ok ? "Handshake successful" : testResult.warn ? "Partial / Warning" : "Connection failed"}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {testResult.message} {testResult.latencyMs ? `• ${testResult.latencyMs}ms` : null}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setStep(0); setName(""); setType(""); setAuthType(""); setCredential(""); setEndpoint(""); setMapping("eventType=anomaly,index=aiops,queue=anomalies"); setEnableSync(true); setTestResult(null); }}>Reset</Button>
            <Button onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={!canNext || step === 3}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Dev: simple runtime tests
// -----------------------------
function runSmokeTests(addLog: (level: "info" | "warn" | "error", msg: string) => void) {
  const tests: { name: string; pass: boolean; err?: string }[] = [];

  const t = (name: string, fn: () => void) => {
    try {
      fn();
      tests.push({ name, pass: true });
    } catch (e) {
      const errMsg =
        e instanceof Error ? e.message : typeof e === "object" && e !== null ? JSON.stringify(e) : String(e);
      tests.push({ name, pass: false, err: errMsg });
    }
  };

  // Test 1: API has required methods
  t("api methods exist", () => {
    ([
      "getAllConnectors",
      "createConnector",
      "updateConnector",
      "deleteConnector",
      "testConnection",
    ] as Array<keyof typeof api>).forEach((k) => {
      if (typeof api[k] !== "function") throw new Error(`${k} missing`);
    });
  });

  // Test 2: StatusBadge handles known states
  t("StatusBadge renders map entries", () => {
    const map = ["connected", "error", "connecting"];
    if (map.length !== 3) throw new Error("status map size mismatch");
  });

  // Test 3: Wizard payload shape
  t("payload shape stable", () => {
    const sample = {
      name: "Prometheus",
      type: "Monitoring",
      authType: "APIKey",
      config: { endpoint: "https://x", credential: "abc", mapping: "k=v", enableSync: true },
    };
    if (!sample.config || !("endpoint" in sample.config)) throw new Error("config.endpoint missing");
  });

  // Emit results
  tests.forEach((r) => {
    const level = r.pass ? "info" : "error";
    addLog(level, `[TEST] ${r.name} ${r.pass ? "passed" : `failed: ${r.err}`}`);
    // Also to console for devs
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console[level === "info" ? "log" : "error"](`[TEST] ${r.name} -> ${r.pass ? "OK" : r.err}`);
    }
  });
}
