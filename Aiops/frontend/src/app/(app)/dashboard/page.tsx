'use client';

import { Activity, Bot, Maximize2, MessageCircle, Minimize2, Pause, Play, Square, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { useAIOpsStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/KpiCard";
import { HealthPill } from "@/components/ui/HealthPill";
import { MiniList } from "@/components/ui/MiniList";
import ClosedIncidentDrawer from "@/components/incidents/ClosedIncidentDrawer";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import topAnimation from "../../../../Guy talking to Robot _ AI Help.json";
import { useAgents, type AgentSummary } from "@/lib/useAgents";
import { useSessionStore } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { useLottieLoader } from "@/lib/useLottieLoader";
import { AGENT_HELLO_HOST } from "@/config/api";

type BackendIncident = {
  sys_id?: string;
  number?: string;
  short_description?: string;
  closed_at?: string | null;
  close_notes?: string;
  notify?: string;
  category?: string;
  u_ai_category?: string;
  [key: string]: any;
};

type BackendResponse = {
  totalIncidents: number;
  activeCount: number;
  incidentTypes: { type: string; count: number }[];
  incidents: BackendIncident[];
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center gap-1" role="status" aria-label="Loading">
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className="h-2.5 w-2.5 rounded-full bg-emerald-200 opacity-80 animate-pulse"
        style={{ animationDelay: `${index * 0.15}s` }}
      />
    ))}
  </div>
);

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const services = useAIOpsStore((state) => state.services);
  const anomalies = useAIOpsStore((state) => state.anomalies);
  const incidents = useAIOpsStore((state) => state.incidents);
  const aiInsights = useAIOpsStore((state) => state.insights);
  const runbooks = useAIOpsStore((state) => state.runbooks);

  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [selectedClosedIncident, setSelectedClosedIncident] = useState<BackendIncident | null>(null);
  const animRef = useRef<HTMLDivElement | null>(null);
  const lottieReady = useLottieLoader();
  const [typed, setTyped] = useState("");

  const { agents, performAgentAction } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | null>(null);
  const [chatAgent, setChatAgent] = useState<AgentSummary | null>(null);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const closeChatDrawer = () => {
    setIsChatMaximized(false);
    setChatAgent(null);
  };
  const [agentLogs, setAgentLogs] = useState<Record<string, { t: string; m: string }[]>>({});
  const [confirm, setConfirm] = useState<{ name: string; action: 'start' | 'stop' } | null>(null);

  const topAnomalies = useMemo(() => anomalies.slice(0, 4), [anomalies]);

  const metrics = useMemo(() => {
    const openIncidents = incidents.filter((incident) => incident.status !== "resolved").length;
    const automationRate = Math.round(
      (runbooks.filter((runbook) => runbook.trigger === "auto").length / runbooks.length) * 100,
    );
    return {
      incidents: openIncidents,
      mttr: "49m",
      automation: `${automationRate}%`,
      savings: "$1.26M",
    };
  }, [incidents, runbooks]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [chatMessages, setChatMessages] = useState<{ speaker: string; text: string; id: number }[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [typingAnimation, setTypingAnimation] = useState<{ messageId: number; text: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = chatContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.style.scrollBehavior = behavior;
      container.scrollTop = container.scrollHeight;
      container.style.scrollBehavior = "auto";
    });
  }, []);
  const streamingScrollRef = useRef<number | null>(null);

  const queueAgentResponse = (reply: string) => {
    if (!chatAgent) return;
    const messageId = Date.now() + 1;
    setChatMessages((prev) => [
      ...prev,
      {
        speaker: chatAgent.name,
        text: "",
        id: messageId,
      },
    ]);
    setTypingAnimation({ messageId, text: reply });
    setIsTyping(true);
  };

  useEffect(() => {
    if (!chatAgent) return;
    setChatMessages([]);
    setDraftMessage("");
    queueAgentResponse("I am Agent and I'm ready to help.");
  }, [chatAgent]);

  const handleSendMessage = async () => {
    if (!chatAgent || !draftMessage.trim()) return;
    const port = chatAgent.port;
    if (!port) {
      return;
    }
    const userMessage = {
      speaker: "You",
      text: draftMessage.trim(),
      id: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setDraftMessage("");

    try {
      const response = await fetch(`${AGENT_HELLO_HOST}:${port}/hello-agent`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.text }),
      });
      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 700));
      queueAgentResponse(data?.reply ?? "Sorry, I could not respond right now.");
    } catch (error) {
      console.error("Chat error", error);
      queueAgentResponse("I couldn't reach the assistant, please try again later.");
    }
  };

  const ChatWindowContent = ({
    headerActions,
    className = "",
  }: {
    headerActions?: ReactNode;
    className?: string;
  }) => (
    <div
      className={`flex w-full flex-col gap-4 overflow-hidden rounded-[36px] border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-900">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Agent chat</p>
            <h3 className="text-3xl font-semibold text-slate-900">{chatAgent?.name}</h3>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Online</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-slate-900"
            onClick={closeChatDrawer}
          >
            Close
          </Button>
        </div>
      </div>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-auto rounded-[32px] border border-slate-200 bg-slate-50 p-4"
      >
        <div className="space-y-4">
          {chatMessages.map((message) => {
            const isUser = message.speaker === "You";
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-400">
                    <Bot className="h-5 w-5" />
                  </span>
                )}
                <div
                  className={`max-w-[78%] space-y-1 rounded-2xl border px-4 py-3 break-words ${
                    isUser
                      ? "border-slate-200 bg-white text-[#1d1464]"
                      : "border-slate-200 bg-slate-200/70 text-slate-700"
                  } ${isUser ? "text-right" : "text-left"}`}
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                    {isUser ? "You" : "Agent"}
                  </p>
                  <div className="text-base whitespace-pre-wrap">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="text-base" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-slate-900" {...props} />
                        ),
                      }}
                    >
                      {message.text ?? ""}
                    </ReactMarkdown>
                  </div>
                </div>
                {isUser && (
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-900">
                    <User className="h-5 w-5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {isTyping && (
          <p className="text-xs italic text-slate-500">Agent is typing...</p>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-2">
                    <textarea
                      className="h-14 flex-1 resize-none border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      rows={3}
                      placeholder="Ask something…"
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      ref={inputRef}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                    />
          <Button
            type="button"
            size="sm"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_10px_25px_rgba(56,189,248,0.4)] hover:from-sky-400 hover:to-blue-500"
            onClick={handleSendMessage}
          >
            <MessageCircle className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (!typingAnimation) return;
    const { messageId, text } = typingAnimation;
    let index = 0;
    const stepDelay = 35;
    const interval = setInterval(() => {
      index += 1;
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, text: text.slice(0, Math.min(index, text.length)) } : message,
        ),
      );
      if (index >= text.length) {
        clearInterval(interval);
        setTypingAnimation(null);
        setIsTyping(false);
      }
    }, stepDelay);
    return () => clearInterval(interval);
  }, [typingAnimation]);

  useEffect(() => {
    if (!chatMessages.length) return;
    const behavior = typingAnimation ? "smooth" : "auto";
    scrollToBottom(behavior);
  }, [chatMessages.length, typingAnimation, scrollToBottom]);

  useEffect(() => {
    if (!typingAnimation) return;
    const step = () => {
      scrollToBottom("smooth");
      streamingScrollRef.current = requestAnimationFrame(step);
    };
    streamingScrollRef.current = requestAnimationFrame(step);
    return () => {
      if (streamingScrollRef.current) {
        cancelAnimationFrame(streamingScrollRef.current);
      }
    };
  }, [typingAnimation, scrollToBottom]);

  useEffect(() => {
    if (!isInputFocused) return;
    const el = inputRef.current;
    if (!el) return;
    const pos = el.value.length;
    el.setSelectionRange(pos, pos);
    el.focus();
  }, [draftMessage, isInputFocused]);

  useEffect(() => {
    if (!chatAgent) {
      setTypingAnimation(null);
      setIsTyping(false);
      setIsChatMaximized(false);
    }
  }, [chatAgent]);

  useEffect(() => {
    if (!chatAgent) return;
    const id = requestAnimationFrame(() => scrollToBottom("auto"));
    return () => cancelAnimationFrame(id);
  }, [chatAgent, scrollToBottom]);

  useEffect(() => {
    let isActive = true;
    setBackendLoading(true);
    setBackendError(null);

    fetch("http://localhost:8000/incidents", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Fetch failed with status ${res.status}`);
        }
        const payload = (await res.json()) as BackendResponse;
        if (isActive) {
          setBackendData(payload);
        }
      })
      .catch((err) => {
        if (isActive) {
          setBackendError(err?.message ?? "Unable to load incidents");
        }
      })
      .finally(() => {
        if (isActive) {
          setBackendLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Initialize top banner Lottie animation
  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as any) : undefined;
    if (!animRef.current || !win?.lottie || !lottieReady) return;
    const anim = win.lottie.loadAnimation({
      container: animRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: topAnimation,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });
    return () => anim?.destroy?.();
  }, [lottieReady]);

  // Typewriter effect for greeting text
  useEffect(() => {
    const firstName = user?.name?.split(" ")[0] ?? "Alice";
    const full = `Hi ${firstName}, keeping services resilient today.`;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [user?.name]);

  // Ensure there is at least one log entry per agent
  useEffect(() => {
    if (!agents.length) return;
    setAgentLogs((prev) => {
      const next = { ...prev };
      agents.forEach((agent) => {
        if (!next[agent.name]) {
          next[agent.name] = [
            {
              t: new Date().toLocaleString(),
              m: `${agent.name} synced with the dashboard.`,
            },
          ];
        }
      });
      return next;
    });
  }, [agents]);

  const toggleAgent = async (name: string, action: "start" | "stop") => {
    const target = agents.find((agent) => agent.name === name);
    if (!target) return;
    try {
      await performAgentAction(target.agentId, action);
      setAgentLogs((prev) => {
        const next = { ...prev };
        const list = next[name] ? [...next[name]] : [];
        list.push({ t: new Date().toLocaleString(), m: `Agent ${action}ed by operator.` });
        next[name] = list;
        return next;
      });
    } catch {
      // ignore errors for now
    }
  };
  const requestToggle = (name: string, action: 'start' | 'stop') => setConfirm({ name, action });

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resolvedCount = backendData?.totalIncidents ?? 0;
  const recentClosed = useMemo(() => {
    if (!backendData) {
      return [];
    }
    return [...backendData.incidents]
      .sort((a, b) =>
        (b.closed_at ? new Date(b.closed_at).getTime() : 0) -
        (a.closed_at ? new Date(a.closed_at).getTime() : 0),
      )
      .slice(0, 5);
  }, [backendData]);
  const activeDisplayValue = backendLoading ? <LoadingSpinner /> : (
    backendData?.activeCount ?? metrics.incidents
  ).toString();
  const resolvedDisplayValue = backendLoading ? <LoadingSpinner /> : resolvedCount.toString();

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator", "executive", "observer"]}>
        <div className="space-y-6" id="top">
          {/* Top banner takes 1/3 of the viewport height */}
          <section className="relative h-[33vh] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]/70">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(79,70,229,0.1),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.1),transparent_55%)]" />
            <div className="relative z-10 flex h-full w-full items-center justify-between gap-6 px-6">
              <div className="max-w-2xl text-left">
                <p className="text-xl font-medium text-[var(--muted)]">&nbsp;</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text)]">
                  {typed}
                  <span className="ml-0.5 inline-block h-[1.15em] w-[2px] translate-y-[-3px] bg-[var(--text)] align-middle animate-pulse" />
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">Your AI control plane is online.</p>
              </div>
              <div className="flex h-full flex-1 items-center justify-end">
                <div ref={animRef} className="h-full w-full max-w-[720px]" />
              </div>
            </div>
          </section>

          {/* In-page navigation */}
          <nav className="mt-2 flex w-full flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-muted)] p-2">
            <Button variant="muted" onClick={() => scrollTo("top")}>Overview</Button>
            <Button variant="muted" onClick={() => scrollTo("agents")}>Agent management</Button>
            <Button variant="muted" onClick={() => scrollTo("recent-incidents")}>Recent incidents</Button>
          </nav>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Active incidents"
              value={activeDisplayValue}
              delta="-18% vs last week"
              trend="down"
              icon={<ShieldIcon />}
              caption={
                backendData ? "Currently active incidents from backend" : "Sev-1 automation closed 3 in the past day"
              }
            />
            <KpiCard
              label="Resolved incidents"
              value={resolvedDisplayValue}
              delta="AI Agent & Hotfix only"
              icon={<ShieldIcon />}
              caption="Filtered by backend incidents service"
            />
            <KpiCard
              label="MTTR"
              value={metrics.mttr}
              delta="11m faster"
              trend="up"
              icon={<Activity className="h-5 w-5" />}
              caption="AI Agents recommended 4 mitigations"
            />
            <KpiCard
              label="Automation rate"
              value={metrics.automation}
              delta="+6 pts"
              icon={<Bot className="h-5 w-5" />}
              caption="Runbooks executed automatically in 55% of incidents"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="space-y-3 lg:col-span-2">
              <p className="section-title">Service health</p>
              <div className="grid gap-3 md:grid-cols-2">
                {services.map((service) => (
                  <HealthPill service={service} key={service.id} />
                ))}
              </div>
            </Card>
            <MiniList
              title="Recent anomalies"
              items={topAnomalies.map((anomaly) => ({
                id: anomaly.id,
                title: `${anomaly.metric} - ${anomaly.value} (baseline ${anomaly.baseline})`,
                meta: `Detected ${new Date(anomaly.detectedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`,
                status:
                  anomaly.severity === "critical"
                    ? "err"
                    : anomaly.severity === "high"
                    ? "warn"
                    : "ok",
              }))}
            />
          </section>

          {/* Agent Management Section */}
          <section id="agents" className="grid gap-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="section-title">Agent management</p>
              <p className="text-sm text-white/60">Start/stop live actions and inspect recent activity.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.name} className="space-y-3 border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:border-white/20 hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold tracking-tight">{agent.name}</p>
                      <p className="text-xs text-white/60">
                        Port: {agent.running && agent.port ? agent.port : "Agent Not Started"} -{" "}
                        {agent.version ?? agent.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Real-time: {agent.running ? 'Running' : 'Stopped'}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-500/85 disabled:opacity-50"
                        onClick={() => requestToggle(agent.name, 'start')}
                        disabled={agent.running}
                      >
                        <Play className="mr-1 h-4 w-4" /> Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500 bg-rose-500 text-white hover:bg-rose-500/85 disabled:opacity-50"
                        onClick={() => requestToggle(agent.name, 'stop')}
                        disabled={!agent.running}
                      >
                        <Pause className="mr-1 h-4 w-4" /> Stop
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!agent.running}
                        onClick={() => agent.running && setChatAgent(agent)}
                        className={`flex items-center gap-1 rounded-full border ${
                          agent.running
                            ? 'border-emerald-400 bg-emerald-500/10 text-white hover:bg-emerald-500/20'
                            : 'border-white/20 bg-white/10 text-white/40'
                        }`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {selectedAgent && (
              <Card className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-semibold">{selectedAgent.name}</p>
                    <p className="text-sm text-white/60">
                      Port: {selectedAgent.running && selectedAgent.port ? selectedAgent.port : "Agent Not Started"} - Version: {selectedAgent.version ?? selectedAgent.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-500/85" onClick={() => requestToggle(selectedAgent.name, 'start')} disabled={selectedAgent.running}>
                      <Play className="mr-1 h-4 w-4" /> Start
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-500 bg-rose-500 text-white hover:bg-rose-500/85" onClick={() => requestToggle(selectedAgent.name, 'stop')} disabled={!selectedAgent.running}>
                      <Square className="mr-1 h-4 w-4" /> Stop
                    </Button>
                    <Button size="sm" variant="muted" onClick={() => setSelectedAgent(null)}>Close</Button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <p className="font-semibold">Performance</p>
                    <p className="mt-1 text-sm text-white/60">CPU 23% • Mem 41% • Actions/min 18</p>
                    <p className="text-xs text-white/50">Synthetic metrics for demo purpose</p>
                  </Card>
                  <Card className="p-4">
                    <p className="font-semibold">Recent logs (12h)</p>
                    <div className="mt-2 max-h-48 space-y-1 overflow-auto pr-2 text-xs text-white/70">
                      {(agentLogs[selectedAgent.name] ?? []).slice(-40).reverse().map((l, idx) => (
                        <p key={idx}>[{l.t}] {l.m}</p>
                      ))}
                    </div>
                  </Card>
                </div>
              </Card>
            )}
          </section>

          {/* Confirmation Modal */}
          {confirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl">
                <p className="text-lg font-semibold text-[var(--text)]">
                  {confirm.action === 'start' ? 'Start' : 'Stop'}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Are you sure you want to {confirm.action} <span className="font-semibold">{confirm.name}</span>?
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="muted" onClick={() => setConfirm(null)}>Cancel</Button>
                  {confirm.action === 'start' ? (
                    <Button className="border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-500/85" variant="outline" onClick={() => { toggleAgent(confirm.name, 'start'); setConfirm(null); }}>
                      <Play className="mr-1 h-4 w-4" /> Start
                    </Button>
                  ) : (
                    <Button className="border-rose-500 bg-rose-500 text-white hover:bg-rose-500/85" variant="outline" onClick={() => { toggleAgent(confirm.name, 'stop'); setConfirm(null); }}>
                      <Square className="mr-1 h-4 w-4" /> Stop
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {chatAgent && !isChatMaximized && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20" onClick={closeChatDrawer} />
              <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm items-stretch px-3">
                <ChatWindowContent
                  className="h-screen rounded-l-[36px]"
                  headerActions={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => setIsChatMaximized(true)}
                      aria-label="Maximize chat"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </>
          )}
          {chatAgent && isChatMaximized && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6"
              onClick={() => setIsChatMaximized(false)}
            >
              <div
                className="w-full max-w-[920px] rounded-[42px]"
                onClick={(event) => event.stopPropagation()}
              >
                <ChatWindowContent
                  className="h-[min(90vh,620px)] w-full"
                  headerActions={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => setIsChatMaximized(false)}
                      aria-label="Minimize chat"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          )}

          <section id="recent-incidents" className="grid gap-6">
            <Card className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="section-title">Recent closed incidents</p>
              </div>
              <div className="min-h-[180px] space-y-3">
                {backendLoading && <p className="text-sm text-white/70">Loading incidents…</p>}
                {backendError && <p className="text-sm text-rose-400">{backendError}</p>}
                {!backendLoading && !backendError && (
                  <>
                    {recentClosed.length === 0 && (
                      <p className="text-sm text-white/60">No closed incidents available.</p>
                    )}
                    {recentClosed.map((incident, index) => (
                      <button
                        key={incident.sys_id ?? incident.number ?? index}
                        type="button"
                        onClick={() => setSelectedClosedIncident(incident)}
                        className="flex w-full flex-col gap-1 rounded-lg border border-white/5 bg-white/5 p-3 text-left text-sm transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-semibold">{incident.number ?? 'Unknown'}</p>
                          <p className="text-xs text-white/60">
                            {incident.closed_at
                              ? new Date(incident.closed_at).toLocaleString()
                              : 'Closed date unknown'}
                          </p>
                        </div>
                        <p className="text-white/70">{incident.short_description ?? 'No description'}</p>
                        <p className="text-xs text-white/50">
                          {(incident.close_notes && String(incident.close_notes)) || 'Closed by AI agent'} • Notify: {incident.notify ?? 'n/a'}
                        </p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </Card>
            {selectedClosedIncident && (
              <ClosedIncidentDrawer
                incident={selectedClosedIncident}
                onClose={() => setSelectedClosedIncident(null)}
              />
            )}
          </section>
        </div>
      </RequireRole>
    </AuthGate>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.418-3.582 8-8 8s-8-3.582-8-8V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
