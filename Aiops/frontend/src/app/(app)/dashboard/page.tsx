'use client';

import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AGENT_HELLO_HOST } from "@/config/api";
import { useSessionStore } from "@/lib/auth/session";
import { getEnterpriseLogo } from "@/lib/enterpriseLogos";
import { useAIOpsStore } from "@/lib/store";
import { useAgents, type AgentSummary } from "@/lib/useAgents";
import { useLottieLoader } from "@/lib/useLottieLoader";
import { AlertTriangle, ArrowRight, Bot, Maximize2, MessageCircle, Minimize2, Pause, Play, Square, User } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import topAnimation from "../../../../Guy talking to Robot _ AI Help.json";

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

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

function formatKey(key: string) {
  return key
    .replace(/^u_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isProbablyDateString(s: string) {
  if (!s) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return !isNaN(Date.parse(s));
  return false;
}

function isURL(s: string) {
  return /^https?:\/\//i.test(s);
}

function IncidentValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-white/50">—</span>;
  }

  if (typeof value === "string") {
    if (isURL(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-300 underline decoration-emerald-400/50 underline-offset-2"
        >
          {value}
        </a>
      );
    }
    if (isProbablyDateString(value)) {
      return <span>{new Date(value).toLocaleString()}</span>;
    }
    return <span className="text-white/90">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-white/90">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => v === null || ["string", "number", "boolean"].includes(typeof v));
    if (allPrimitive) {
      return <span className="text-white/90">{value.map((v) => String(v ?? "—")).join(", ")}</span>;
    }
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <IncidentValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (("display_value" in obj && (obj as any).display_value) || ("value" in obj && "link" in obj)) {
      const display = (obj as any).display_value ?? (obj as any).value;
      const link = (obj as any).link as string | undefined;
      return (
        <div className="flex items-center gap-2">
          <span className="text-white/90">{String(display)}</span>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
            >
              View
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2">
        {Object.keys(obj).map((k) => (
          <div key={k} className="grid grid-cols-3 gap-2">
            <div className="col-span-1 text-xs uppercase tracking-wide text-white/50">{formatKey(k)}</div>
            <div className="col-span-2 text-sm text-white/90">
              <IncidentValue value={obj[k]} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-white/90">{String(value)}</span>;
}

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
  const [selectedClosedIncidentId, setSelectedClosedIncidentId] = useState<string | null>(null);
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
  const [serviceNowCount, setServiceNowCount] = useState<number | null>(null);
  const serviceNowCountRetryRef = useRef<number | null>(null);
  const [serviceNowCountLoading, setServiceNowCountLoading] = useState(false);
  const [serviceNowIncidentStats, setServiceNowIncidentStats] = useState<{
    total: number | null;
    open: number | null;
    closed: number | null;
  }>({ total: null, open: null, closed: null });
  const [serviceNowIncidentsLoading, setServiceNowIncidentsLoading] = useState(false);
  const [serviceNowIncidents, setServiceNowIncidents] = useState<any[]>([]);
  const [selectedServiceNowIncidentId, setSelectedServiceNowIncidentId] = useState<string | null>(null);
  const [incidentPieHover, setIncidentPieHover] = useState<"open" | "closed" | null>(null);
  const incidentPieRef = useRef<HTMLDivElement | null>(null);

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
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const [chatMessages, setChatMessages] = useState<{ speaker: string; text: string; id: number }[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [typingAnimation, setTypingAnimation] = useState<{ messageId: number; text: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const onlineAgentCount = useMemo(() => agents.filter((a) => a.running).length, [agents]);
  const totalAgentCount = agents.length;
  const offlineAgentCount = Math.max(0, totalAgentCount - onlineAgentCount);
  const onlinePercent = totalAgentCount ? Math.round((onlineAgentCount / totalAgentCount) * 100) : 0;
  const [hoveredSegment, setHoveredSegment] = useState<"online" | "offline" | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const agentMixCardRef = useRef<HTMLDivElement | null>(null);
  const agentMixHoverRef = useRef<"online" | "offline" | null>(null);

  const formatMuleResponse = (raw: string): string => {
    if (!raw) return "No response from agent.";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");
      const title = doc.querySelector("h1,h2,h3,h4,h5,h6")?.textContent?.trim();
      const items = Array.from(doc.querySelectorAll("li")).map((li) => li.textContent?.trim()).filter(Boolean);
      if (items.length) {
        const heading = title ? `${title}` : "Agent response";
        return [heading, ...items.map((item) => `• ${item}`)].join("\n");
      }
      const bodyText = doc.body.textContent ?? "";
      return bodyText.trim() || raw;
    } catch {
      return raw;
    }
  };
  const serializeAgentResponse = (payload: unknown): string => {
    if (payload === null || payload === undefined) return "No response from agent.";
    if (typeof payload === "string") return payload;
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };
  const getGroqResponse = async (userQuestion: string, agentRawResponse: unknown): Promise<string | null> => {
    if (!GROQ_API_KEY) return null;
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant summarizing and extracting key insights from ServiceNow agent responses. Reply in concise natural language only. Do not return tables, code blocks, or raw JSON. Provide a brief, human-readable answer.",
            },
            {
              role: "user",
              content: `User question:\n${userQuestion}\n\nAgent raw response (JSON):\n${serializeAgentResponse(agentRawResponse)}`,
            },
          ],
        }),
      });
      const llmJson = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Groq LLM error response", llmJson);
        return null;
      }
      const llmReply = llmJson?.choices?.[0]?.message?.content;
      return typeof llmReply === "string" ? llmReply : serializeAgentResponse(llmReply);
    } catch (err) {
      console.error("Groq LLM request failed", err);
      return null;
    }
  };
  const agentMixGradient = useMemo(() => {
    const onlineColor = "#22c55e";
    const offlineColor = "#cbd5e1";
    if (!totalAgentCount) return `conic-gradient(${offlineColor} 0% 100%)`;
    const pct = onlinePercent;
    if (pct <= 0) return `conic-gradient(${offlineColor} 0% 100%)`;
    if (pct >= 100) return `conic-gradient(${onlineColor} 0% 100%)`;
    return `conic-gradient(${onlineColor} 0% ${pct}%, ${offlineColor} ${pct}% 100%)`;
  }, [onlineAgentCount, totalAgentCount, onlinePercent]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const anchor = chatBottomRef.current;
    if (!anchor) return;
    requestAnimationFrame(() => {
      anchor.scrollIntoView({ behavior, block: "end" });
    });
  }, []);
  const streamingScrollRef = useRef<number | null>(null);
  const pinToBottomOnFocus = useCallback(() => {
    scrollToBottom("auto");
    requestAnimationFrame(() => scrollToBottom("auto"));
    setTimeout(() => scrollToBottom("auto"), 60);
  }, [scrollToBottom]);
  const pinOnButtonInteraction = useCallback(() => {
    requestAnimationFrame(() => scrollToBottom("auto"));
    setTimeout(() => scrollToBottom("auto"), 60);
  }, [scrollToBottom]);

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

  useEffect(() => {
    let isCancelled = false;
    if (serviceNowCountRetryRef.current) {
      clearTimeout(serviceNowCountRetryRef.current);
      serviceNowCountRetryRef.current = null;
    }
    const controller = new AbortController();
    const serviceNowAgent = agents.find(
      (agent) =>
        agent.running &&
        !!agent.port &&
        (agent.enterprise ?? agent.type ?? "").toLowerCase().includes("servicenow"),
    );

    if (!serviceNowAgent) {
      setServiceNowCountLoading(false);
      setServiceNowCount(null);
      setServiceNowIncidentStats({ total: null, open: null, closed: null });
      setServiceNowIncidents([]);
      setSelectedServiceNowIncidentId(null);
      setServiceNowIncidentsLoading(false);
      return () => {
        controller.abort();
      };
    }

    const fetchCount = async (allowRetry: boolean) => {
      setServiceNowCountLoading(true);
      setServiceNowIncidentsLoading(true);
      try {
        const [countResp, detailsResp] = await Promise.all([
          fetch(`${AGENT_HELLO_HOST}:${serviceNowAgent.port}/agent/serviceNow/count`, {
            method: "GET",
            headers: {
              accept: "application/json",
            },
            signal: controller.signal,
          }),
          fetch(`${AGENT_HELLO_HOST}:${serviceNowAgent.port}/agent/serviceNow/incidentDetails`, {
            method: "GET",
            headers: {
              accept: "application/json",
            },
            signal: controller.signal,
          }),
        ]);

        const countJson = await countResp.json().catch(() => null);
        const detailsJson = await detailsResp.json().catch(() => null);

        if (!countResp.ok) {
          throw new Error("Unable to fetch ServiceNow count");
        }
        const value = Number(countJson?.count);
        if (!isCancelled) {
          setServiceNowCount(Number.isFinite(value) ? value : null);
          setServiceNowCountLoading(false);
        }

        if (!detailsResp.ok) {
          throw new Error("Unable to fetch ServiceNow incidents");
        }
        const incidents: any[] = Array.isArray(detailsJson?.incidents) ? detailsJson.incidents : [];
        const sortedIncidents = [...incidents].sort((a, b) => {
          const da = a?.opened_at ? new Date(a.opened_at).getTime() : 0;
          const db = b?.opened_at ? new Date(b.opened_at).getTime() : 0;
          return db - da;
        });
        const closed = incidents.filter((inc) => String(inc?.status ?? "").toLowerCase() === "closed").length;
        const open = incidents.filter((inc) => String(inc?.status ?? "").toLowerCase() === "open").length;
        const totalFromDetails = Number(detailsJson?.total_incidents);
        if (!isCancelled) {
          setServiceNowIncidentStats({
            total: Number.isFinite(totalFromDetails) ? totalFromDetails : Number.isFinite(value) ? value : null,
            open,
            closed,
          });
          setServiceNowIncidents(sortedIncidents);
          if (!selectedServiceNowIncidentId && sortedIncidents.length) {
            const firstClosed = sortedIncidents.find(
              (inc) => String(inc?.status ?? "").toLowerCase() === "closed",
            );
            setSelectedServiceNowIncidentId(firstClosed?.number ?? sortedIncidents[0]?.number ?? null);
          }
          setServiceNowIncidentsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setServiceNowCount(null);
          setServiceNowCountLoading(false);
          setServiceNowIncidentStats({ total: null, open: null, closed: null });
          setServiceNowIncidents([]);
          setSelectedServiceNowIncidentId(null);
          setServiceNowIncidentsLoading(false);
          if (allowRetry) {
            serviceNowCountRetryRef.current = window.setTimeout(() => {
              fetchCount(false);
            }, 1500);
          }
        }
      }
    };

    fetchCount(true);

    return () => {
      isCancelled = true;
      controller.abort();
      if (serviceNowCountRetryRef.current) {
        clearTimeout(serviceNowCountRetryRef.current);
        serviceNowCountRetryRef.current = null;
      }
      setServiceNowCountLoading(false);
      setServiceNowIncidentsLoading(false);
      setServiceNowIncidents([]);
    };
  }, [agents]);

  const handleSendMessage = async () => {
    if (!chatAgent || !draftMessage.trim()) return;
    const isMuleAgent =
      (chatAgent.enterprise ?? chatAgent.type ?? "").toLowerCase().includes("mule");
    const isServiceNowAgent =
      (chatAgent.enterprise ?? chatAgent.type ?? "").toLowerCase().includes("servicenow");
    const port = chatAgent.port;
    const userMessage = {
      speaker: "You",
      text: draftMessage.trim(),
      id: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setDraftMessage("");
    inputRef.current?.focus();

    setIsTyping(true);

    try {
      let data: any = null;
      if (isMuleAgent) {
        if (!port) {
          throw new Error("Agent port is unavailable");
        }
        const muleEndpoint = `${AGENT_HELLO_HOST}:${port}/agent/mule/chat`;
        const mulePayload = {
          message: userMessage.text,
          agent_id: String(chatAgent.agentId ?? chatAgent.name ?? ""),
        };
        const response = await fetch(muleEndpoint, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mulePayload),
        });
        const muleJson = await response.json().catch(() => null);
        console.log("Mule chat response", { status: response.status, data: muleJson });
        data = muleJson;
        if (!response.ok) {
          const msg = muleJson?.message ?? "Unable to reach mule agent";
          throw new Error(msg);
        }
      } else if (isServiceNowAgent) {
        if (!port) {
          throw new Error("Agent port is unavailable");
        }
        const serviceNowEndpoint = `${AGENT_HELLO_HOST}:${port}/agent/serviceNow/chat`;
        const serviceNowPayload = {
          message: userMessage.text,
          agent_id: String(chatAgent.agentId ?? chatAgent.name ?? ""),
        };
        const response = await fetch(serviceNowEndpoint, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(serviceNowPayload),
        });
        const serviceNowJson = await response.json().catch(() => null);
        console.log("ServiceNow chat response", { status: response.status, data: serviceNowJson });
        data = serviceNowJson;
        if (!response.ok) {
          const msg = serviceNowJson?.message ?? "Unable to reach ServiceNow agent";
          throw new Error(msg);
        }
      } else {
        if (!port) {
          throw new Error("Agent port is unavailable");
        }
        const response = await fetch(`${AGENT_HELLO_HOST}:${port}/hello-agent`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: userMessage.text }),
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error("Unable to reach agent");
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      const rawReply = data?.reply ?? data?.message ?? data ?? "Sorry, I could not respond right now.";
      const llmReply = await getGroqResponse(userMessage.text, data);
      if (llmReply) {
        console.log("Groq LLM chat response", llmReply);
      } else {
        console.log("Groq LLM chat response unavailable");
      }
      const finalText =
        llmReply ??
        (typeof rawReply === "string" ? rawReply : "I couldn't generate a natural-language summary right now.");
      setChatMessages((prev) => [
        ...prev,
        { speaker: `${chatAgent.name}`, text: finalText, id: Date.now() + 3 },
      ]);
      setIsTyping(false);
    } catch (error) {
      console.error("Chat error", error);
      const fallback = "I couldn't reach the assistant, please try again later.";
      setChatMessages((prev) => [
        ...prev,
        { speaker: chatAgent.name, text: fallback, id: Date.now() + 4 },
      ]);
      setIsTyping(false);
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
      onMouseDownCapture={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("button")) {
          pinOnButtonInteraction();
        }
      }}
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
              {chatAgent?.port ? (
                <span className="tracking-[0.2em] text-slate-500">Port: {chatAgent.port}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isChatMaximized && chatAgent ? (() => {
            const logo = getEnterpriseLogo(chatAgent.enterprise ?? chatAgent.type);
            return logo ? (
              <div className="flex items-center justify-center min-w-[180px]">
                <img
                  src={logo}
                  alt={`${chatAgent.enterprise ?? chatAgent.type ?? "Agent"} logo`}
                  className="h-16 w-28 object-contain"
                />
              </div>
            ) : null;
          })() : null}
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
          <div ref={chatBottomRef} className="h-px w-full" aria-hidden="true" />
        </div>
        {isTyping && (
          <p className="text-xs italic text-slate-500">Agent is typing...</p>
        )}
      </div>
      <div className="space-y-3">
        <form
          className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendMessage();
          }}
        >
                    <textarea
                      className="h-14 flex-1 resize-none border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      rows={3}
                      placeholder="Ask something…"
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      ref={inputRef}
                      onFocus={() => {
                        setIsInputFocused(true);
                        pinToBottomOnFocus();
                      }}
                      onClick={pinToBottomOnFocus}
                      onBlur={() => setIsInputFocused(false)}
                    />
          <Button
            type="button"
            size="sm"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_10px_25px_rgba(56,189,248,0.4)] hover:from-sky-400 hover:to-blue-500"
            onMouseDown={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
            onClick={handleSendMessage}
          >
            <MessageCircle className="h-5 w-5 text-white" />
          </Button>
        </form>
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
      scrollToBottom("auto");
      if (index >= text.length) {
        clearInterval(interval);
        setTypingAnimation(null);
        setIsTyping(false);
      }
    }, stepDelay);
    return () => clearInterval(interval);
  }, [typingAnimation, scrollToBottom]);

  useLayoutEffect(() => {
    if (!chatMessages.length) return;
    const behavior = typingAnimation ? "auto" : "smooth";
    scrollToBottom(behavior);
  }, [chatMessages, typingAnimation, scrollToBottom]);

  useEffect(() => {
    if (!typingAnimation) return;
    const step = () => {
      scrollToBottom("auto");
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
    if (!isInputFocused) return;
    pinToBottomOnFocus();
  }, [isInputFocused, pinToBottomOnFocus]);

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
    if (!chatAgent) return;
    requestAnimationFrame(() => scrollToBottom("auto"));
    setTimeout(() => scrollToBottom("auto"), 80);
  }, [isChatMaximized, chatAgent, scrollToBottom]);

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
  const [showAllAgents, setShowAllAgents] = useState(false);
  const visibleAgents = useMemo(
    () => (showAllAgents ? agents : agents.slice(0, Math.min(agents.length, 6))),
    [agents, showAllAgents],
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resolvedCount = backendData?.totalIncidents ?? 0;
  const incidentKey = useCallback(
    (incident: BackendIncident, index?: number) => incident.sys_id ?? incident.number ?? `idx-${index ?? 0}`,
    [],
  );
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
  const selectedClosedIncident = useMemo(() => {
    return (
      recentClosed.find((incident, idx) => incidentKey(incident, idx) === selectedClosedIncidentId) ?? null
    );
  }, [incidentKey, recentClosed, selectedClosedIncidentId]);
  useEffect(() => {
    if (recentClosed.length === 0) {
      setSelectedClosedIncidentId(null);
      return;
    }
    const stillExists = recentClosed.some((incident, idx) => incidentKey(incident, idx) === selectedClosedIncidentId);
    if (!stillExists) {
      setSelectedClosedIncidentId(incidentKey(recentClosed[0], 0));
    }
  }, [incidentKey, recentClosed, selectedClosedIncidentId]);
  const totalIncidentsDisplayValue =
    serviceNowCountLoading || serviceNowIncidentsLoading ? <LoadingSpinner /> :
    serviceNowIncidentStats.total !== null ? serviceNowIncidentStats.total.toString() :
    serviceNowCount !== null ? serviceNowCount.toString() : "--";

  const resolvedDisplayValue =
    serviceNowIncidentsLoading ? <LoadingSpinner /> :
    serviceNowIncidentStats.closed !== null ? serviceNowIncidentStats.closed.toString() : "--";
  const totalIncidentsNumber =
    serviceNowIncidentStats.total !== null
      ? serviceNowIncidentStats.total
      : serviceNowCount !== null
        ? serviceNowCount
        : null;
  const openIncidentsNumber = serviceNowIncidentStats.open ?? null;
  const closedIncidentsNumber = serviceNowIncidentStats.closed ?? null;
  const incidentPieOpenPct = useMemo(() => {
    if (openIncidentsNumber === null || closedIncidentsNumber === null) return null;
    const total = openIncidentsNumber + closedIncidentsNumber;
    if (!total || total <= 0) return null;
    return Math.min(100, Math.max(0, (openIncidentsNumber / total) * 100));
  }, [openIncidentsNumber, closedIncidentsNumber]);
  const serviceNowClosedIncidents = useMemo(
    () => serviceNowIncidents.filter((inc) => String(inc?.status ?? "").toLowerCase() === "closed"),
    [serviceNowIncidents],
  );
  const selectedServiceNowIncident = useMemo(() => {
    if (!selectedServiceNowIncidentId) return null;
    return serviceNowIncidents.find((inc) => inc?.number === selectedServiceNowIncidentId) ?? null;
  }, [selectedServiceNowIncidentId, serviceNowIncidents]);

  useEffect(() => {
    if (selectedServiceNowIncidentId) return;
    if (serviceNowClosedIncidents.length) {
      setSelectedServiceNowIncidentId(serviceNowClosedIncidents[0].number ?? null);
    } else if (serviceNowIncidents.length) {
      setSelectedServiceNowIncidentId(serviceNowIncidents[0].number ?? null);
    }
  }, [selectedServiceNowIncidentId, serviceNowClosedIncidents, serviceNowIncidents]);

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator", "executive", "observer"]}>
        <div className="space-y-6" id="top">
          {/* Profile header */}
          <section className="rounded-xl bg-transparent p-6 shadow-none">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-inner">
                <User className="h-10 w-10" />
              </span>
              <div className="flex-1 min-w-[240px] space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900">{user?.name ?? "Mr. Gregore Joy"}</h2>
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                  <span>
                    Role: <span className="font-medium text-slate-800 capitalize">{user?.role ?? "N/A"}</span>
                  </span>
                  <span>
                    Email:{" "}
                    <a className="font-medium text-indigo-600 hover:underline" href={`mailto:${user?.email ?? ""}`}>
                      {user?.email ?? "johnhonai@testing.com"}
                    </a>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] items-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Profile Completion: 75%</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <span
                      key={bar}
                      className={`h-2 w-16 rounded-full ${bar <= 4 ? "bg-teal-400" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">{totalIncidentsDisplayValue}</p>
                <p className="text-sm text-slate-600">Total Incidents</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">{resolvedDisplayValue}</p>
                <p className="text-sm text-slate-600">Resolved Incidents</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-900">
                  {serviceNowIncidentsLoading ? <LoadingSpinner /> : (
                    serviceNowIncidentStats.open !== null ? serviceNowIncidentStats.open.toString() : "--"
                  )}
                </p>
                <p className="text-sm text-slate-600">Open Incidents</p>
              </div>
            </div>
          </section>

          {/* In-page navigation */}
          <nav className="mt-2 flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <Button variant="muted" className="rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 border-none" onClick={() => scrollTo("top")}>Overview</Button>
            <Button variant="muted" className="rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200" onClick={() => scrollTo("agents")}>Agent management</Button>
            <Button variant="muted" className="rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200" onClick={() => scrollTo("recent-incidents")}>Recent incidents</Button>
          </nav>

          <section className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
            <Card className="relative overflow-hidden border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" aria-hidden="true" />
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total incidents</p>
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">
                    {serviceNowCountLoading || serviceNowIncidentsLoading ? <LoadingSpinner /> : (
                      totalIncidentsNumber !== null ? totalIncidentsNumber : "--"
                    )}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {serviceNowCount !== null
                      ? "ServiceNow-reported total incidents"
                      : "Start ServiceNow agent to see incident details"}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
                <div className="flex flex-col gap-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>Closed</span>
                    <span className="text-slate-500">
                      {serviceNowIncidentsLoading ? "…" : closedIncidentsNumber ?? "--"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500" aria-hidden="true" />
                    <span>Open</span>
                    <span className="text-slate-500">
                      {serviceNowIncidentsLoading ? "…" : openIncidentsNumber ?? "--"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {serviceNowIncidentsLoading ? (
                    <LoadingSpinner />
                  ) : totalIncidentsNumber !== null && openIncidentsNumber !== null && closedIncidentsNumber !== null ? (
                    <div
                      ref={incidentPieRef}
                      className={`relative h-40 w-40 rounded-full shadow-[0_18px_38px_rgba(0,0,0,0.1)] transition duration-200 ${
                        incidentPieHover ? "scale-[1.04] shadow-[0_22px_45px_rgba(0,0,0,0.16)]" : ""
                      }`}
                      aria-label="Incident open vs closed"
                      style={{
                        backgroundImage: (() => {
                          const total = openIncidentsNumber + closedIncidentsNumber;
                          if (!total || total <= 0) return "conic-gradient(#cbd5e1 0% 100%)";
                          const openPct = incidentPieOpenPct ?? Math.min(100, Math.max(0, (openIncidentsNumber / total) * 100));
                          const openColor = incidentPieHover === "open" ? "#dc2626" : "#ef4444";
                          const closedColor = incidentPieHover === "closed" ? "#16a34a" : "#22c55e";
                          return `conic-gradient(${openColor} 0% ${openPct}%, ${closedColor} ${openPct}% 100%)`;
                        })(),
                      }}
                      onMouseMove={(event) => {
                        if (!incidentPieRef.current || incidentPieOpenPct === null) return;
                        const rect = incidentPieRef.current.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        const x = event.clientX - cx;
                        const y = event.clientY - cy;
                        const angleFromTop = (Math.atan2(y, x) * 180) / Math.PI + 90;
                        const angle = (angleFromTop + 360) % 360;
                        const openAngle = incidentPieOpenPct * 3.6;
                        setIncidentPieHover(angle <= openAngle ? "open" : "closed");
                      }}
                      onMouseLeave={() => setIncidentPieHover(null)}
                    >
                      <div className="absolute inset-5 rounded-full bg-white/92 backdrop-blur-sm grid place-items-center text-base font-semibold text-slate-800">
                        {totalIncidentsNumber}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-slate-200 text-xs text-slate-500 text-center p-4">
                      Start ServiceNow agent
                    </div>
                  )}
                </div>
              </div>
            </Card>
            <Card className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/95 to-slate-50 shadow-[0_14px_35px_rgba(15,23,42,0.12)] xl:col-span-2">
              <div className="flex items-start justify-between gap-4 p-5" ref={agentMixCardRef}>
                <div className="relative flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Agent</span>
                      <Bot className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">
                      {totalAgentCount || 0} <span className="text-base font-normal text-slate-500">total</span>
                    </p>
                    <div className="flex items-center gap-4 pt-2 text-sm">
                      <div
                        className="flex items-center gap-2 text-slate-700 cursor-pointer"
                        onMouseEnter={(e) => {
                          if (!agentMixCardRef.current) return;
                          const rect = agentMixCardRef.current.getBoundingClientRect();
                          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top + 12 });
                          setHoveredSegment("online");
                        }}
                        onMouseLeave={() => {
                          setHoveredSegment(null);
                          setTooltipPos(null);
                        }}
                      >
                        <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
                        <span
                          className={`font-medium transition ${
                            hoveredSegment === "online" ? "underline decoration-emerald-500 decoration-2" : ""
                          }`}
                        >
                          Online
                        </span>
                        <span className="text-emerald-600 font-semibold">{onlineAgentCount}</span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-slate-700 cursor-pointer"
                        onMouseEnter={(e) => {
                          if (!agentMixCardRef.current) return;
                          const rect = agentMixCardRef.current.getBoundingClientRect();
                          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top + 12 });
                          setHoveredSegment("offline");
                        }}
                        onMouseLeave={() => {
                          setHoveredSegment(null);
                          setTooltipPos(null);
                        }}
                      >
                        <span className="h-3 w-3 rounded-full bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.25)]" />
                        <span
                          className={`font-medium transition ${
                            hoveredSegment === "offline" ? "underline decoration-slate-400 decoration-2" : ""
                          }`}
                        >
                          Offline
                        </span>
                        <span className="text-slate-500 font-semibold">{offlineAgentCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Link
                      to="/agent-management"
                      className="group inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#0ea5e9] via-[#22c55e] to-[#0ea5e9] px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,197,94,0.35)] ring-1 ring-white/20 transition hover:translate-x-0.5 hover:shadow-[0_12px_28px_rgba(14,165,233,0.35)]"
                    >
                      Go to agent management
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
                {totalAgentCount > 0 ? (
                  <div
                    className={`relative h-44 w-44 sm:h-52 sm:w-52 transition duration-200 ${
                      hoveredSegment ? "scale-[1.03] shadow-[0_20px_44px_rgba(0,0,0,0.16)]" : ""
                    }`}
                    onMouseMove={(e) => {
                      if (!totalAgentCount || !agentMixCardRef.current) return;
                      const pieRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const cardRect = agentMixCardRef.current.getBoundingClientRect();
                      const x = e.clientX - (pieRect.left + pieRect.width / 2);
                      const y = e.clientY - (pieRect.top + pieRect.height / 2);
                      const angleFromTop = (Math.atan2(y, x) * 180) / Math.PI + 90;
                      const angle = (angleFromTop + 360) % 360;
                      const onlineAngle = (onlinePercent / 100) * 360;
                      const hoverSide = angle <= onlineAngle ? "online" : "offline";
                      setHoveredSegment(hoverSide);
                      agentMixHoverRef.current = hoverSide;
                      setTooltipPos({ x: e.clientX - cardRect.left, y: e.clientY - cardRect.top + 12 });
                    }}
                    onMouseLeave={() => {
                      setHoveredSegment(null);
                      agentMixHoverRef.current = null;
                      setTooltipPos(null);
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
                      style={{
                        backgroundImage: (() => {
                          if (!totalAgentCount) return agentMixGradient;
                          const isOnline = agentMixHoverRef.current === "online";
                          const isOffline = agentMixHoverRef.current === "offline";
                          const onlineColor = isOnline ? "#16a34a" : "#22c55e";
                          const offlineColor = isOffline ? "#cbd5e1" : "#e2e8f0";
                          if (!totalAgentCount) return `conic-gradient(${offlineColor} 0% 100%)`;
                          const pct = onlinePercent;
                          if (pct <= 0) return `conic-gradient(${offlineColor} 0% 100%)`;
                          if (pct >= 100) return `conic-gradient(${onlineColor} 0% 100%)`;
                          return `conic-gradient(${onlineColor} 0% ${pct}%, ${offlineColor} ${pct}% 100%)`;
                        })(),
                      }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-white/0 opacity-90"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-500">
                    No agents to display
                  </div>
                )}
                <div
                  className="pointer-events-none absolute w-64 rounded-xl border border-slate-200/60 bg-white/90 p-3 shadow-lg backdrop-blur transition-opacity duration-150"
                  style={{
                    opacity: hoveredSegment && tooltipPos ? 1 : 0,
                    left: tooltipPos?.x ?? 0,
                    top: tooltipPos?.y ?? 0,
                    transform: "translate(12px, 12px)",
                  }}
                >
                  {hoveredSegment && (
                    <>
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {hoveredSegment === "online" ? "Online agents" : "Offline agents"}
                      </p>
                      <ul className="space-y-1 text-sm text-slate-800">
                        {(
                          hoveredSegment === "online"
                            ? agents.filter((a) => a.running)
                            : agents.filter((a) => !a.running)
                        )
                          .slice(0, 4)
                          .map((agent) => (
                            <li key={agent.agentId} className="flex items-center justify-between">
                              <span className="font-medium">{agent.name}</span>
                              {hoveredSegment === "online" && agent.port ? (
                                <span className="text-xs text-slate-500">:{agent.port}</span>
                              ) : null}
                            </li>
                          ))}
                        {(() => {
                          const list =
                            hoveredSegment === "online"
                              ? agents.filter((a) => a.running)
                              : agents.filter((a) => !a.running);
                          const remaining = Math.max(0, list.length - 4);
                          return remaining > 0 ? (
                            <li className="text-xs text-slate-500">+{remaining} more</li>
                          ) : null;
                        })()}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </section>

          {/* Agent Management Section */}
          <section id="agents" className="grid gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 min-w-[96px] bg-slate-400/50" aria-hidden="true" />
                <div className="flex items-center gap-2 whitespace-nowrap px-3">
                  <Bot className="h-5 w-5 text-white" aria-hidden="true" />
                  <p className="section-title">Agent management</p>
                </div>
                <span className="h-px flex-1 min-w-[96px] bg-slate-400/50" aria-hidden="true" />
              </div>
              <p className="text-sm text-white/60 text-center sm:text-right">
                Start/stop live actions and inspect recent activity.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleAgents.length === 0 ? (
                <p className="col-span-full text-center text-sm text-white/70">No agents to display.</p>
              ) : (
                visibleAgents.map((agent) => (
                  <Card key={agent.name} className="space-y-3 border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:border-white/20 hover:bg-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white">
                          <Bot className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-lg font-semibold tracking-tight">{agent.name}</p>
                          <p className="text-xs text-white/60">
                            Port: {agent.running && agent.port ? agent.port : "Agent Not Started"} -{" "}
                            {agent.version ?? agent.type}
                          </p>
                        </div>
                      </div>
                      {(() => {
                        const logoUrl = getEnterpriseLogo(agent.enterprise);
                        const enterpriseKey = (agent.enterprise ?? "").trim().toLowerCase();
                        const isServiceNow = enterpriseKey === "servicenow";
                        const isMule = enterpriseKey.includes("mule");
                        const isIbm = enterpriseKey.includes("ibm");
                        if (!logoUrl) {
                          return <div className="h-8 w-8" aria-hidden="true" />;
                        }
                        const baseImg = (
                          <img
                            src={logoUrl}
                            alt={`${agent.enterprise ?? "Enterprise"} logo`}
                            className={`object-contain ${
                              isServiceNow ? "h-10 w-24" : isMule ? "h-10 w-10" : "h-8 w-8"
                            }`}
                          />
                        );
                        if (isMule) {
                          return (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full" aria-label={`${agent.enterprise ?? "Enterprise"} logo`}>
                              <div className="absolute inset-0 scale-125">{baseImg}</div>
                            </div>
                          );
                        }
                        if (isIbm || isServiceNow) {
                          return baseImg;
                        }
                        return (
                          <div
                            className="rounded-full bg-white/80 p-1 shadow-sm"
                            aria-label={`${agent.enterprise ?? "Enterprise"} logo`}
                          >
                            {baseImg}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/70">Real-time: {agent.running ? 'Running' : 'Stopped'}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-none bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:shadow-[0_10px_24px_rgba(16,185,129,0.42)] hover:scale-[1.01] rounded-full px-4 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
                          onClick={() => requestToggle(agent.name, 'start')}
                          disabled={agent.running}
                        >
                          <Play className="mr-1 h-4 w-4" /> Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-none bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] transition hover:shadow-[0_10px_24px_rgba(244,63,94,0.42)] hover:scale-[1.01] rounded-full px-4 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
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
                ))
              )}
            </div>
            {agents.length > 6 && (
              <div className="flex justify-center">
                {!showAllAgents ? (
                  <Button
                    variant="outline"
                    className="mt-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => setShowAllAgents(true)}
                  >
                    See more agents
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => setShowAllAgents(false)}
                  >
                    See less agents
                  </Button>
                )}
              </div>
            )}

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
                  <Button
                    variant="outline"
                    className="border-none bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] transition hover:shadow-[0_10px_24px_rgba(244,63,94,0.42)] hover:scale-[1.01] rounded-full px-4"
                    onClick={() => setConfirm(null)}
                  >
                    Cancel
                  </Button>
                  {confirm.action === 'start' ? (
                    <Button
                      className="border-none bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:shadow-[0_10px_24px_rgba(16,185,129,0.42)] hover:scale-[1.01] rounded-full px-4"
                      variant="outline"
                      onClick={() => { toggleAgent(confirm.name, 'start'); setConfirm(null); }}
                    >
                      <Play className="mr-1 h-4 w-4" /> Start
                    </Button>
                  ) : (
                    <Button
                      className="border-none bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] transition hover:shadow-[0_10px_24px_rgba(244,63,94,0.42)] hover:scale-[1.01] rounded-full px-4"
                      variant="outline"
                      onClick={() => { toggleAgent(confirm.name, 'stop'); setConfirm(null); }}
                    >
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

          <section id="recent-incidents" className="grid gap-3 lg:grid-cols-[220px_1fr] items-stretch">
            <div className="flex items-center gap-3 lg:col-span-2">
              <span className="h-px flex-1 min-w-[96px] bg-slate-400/50" aria-hidden="true" />
              <div className="flex items-center gap-2 whitespace-nowrap px-3">
                <AlertTriangle className="h-5 w-5 text-rose-500" aria-hidden="true" />
                <p className="section-title">Recent closed incidents</p>
              </div>
              <span className="h-px flex-1 min-w-[96px] bg-slate-400/50" aria-hidden="true" />
            </div>

            <Card className="flex flex-col space-y-4 w-fit max-w-[280px]">
              <div className="min-h-[220px] flex-1">
                <p className="section-title">Incident List</p><br></br>
                {serviceNowIncidentsLoading ? (
                  <p className="text-sm text-white/70">Loading incidents…</p>
                ) : serviceNowClosedIncidents.length === 0 ? (
                  <p className="text-sm text-white/60">
                    {serviceNowIncidentStats.total === null
                      ? "Start ServiceNow agent to see incident details."
                      : "No closed incidents available."}
                  </p>
                ) : (
                  <ScrollArea className="h-[520px] pr-3">
                    <div className="space-y-3">
                      {serviceNowClosedIncidents.map((incident) => {
                        const key = incident.number ?? incident.opened_at ?? String(incident.short_description ?? "");
                        const isSelected = selectedServiceNowIncidentId === incident.number;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedServiceNowIncidentId(incident.number ?? null)}
                            className={`group flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm transition ${
                              isSelected
                                ? "border-slate-300 bg-slate-200 text-slate-900 shadow-[0_6px_20px_rgba(0,0,0,0.14)]"
                                : "border-transparent bg-white/5 text-white hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className={`h-4 w-4 ${
                                  isSelected ? "text-rose-500" : "text-rose-300 group-hover:text-rose-400"
                                }`}
                                aria-hidden="true"
                              />
                              <p className={`font-semibold ${isSelected ? "text-slate-900" : "text-white"}`}>
                                {incident.number ?? "Unknown"}
                              </p>
                            </div>
                            <ArrowRight
                              className={`h-4 w-4 ${
                                isSelected ? "text-slate-700" : "text-transparent group-hover:text-slate-400"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Card>

            <Card className="flex flex-col gap-3 min-h-[220px]">
  <div className="flex items-start justify-between">
    <p className="section-title">Incident details</p>
    {selectedServiceNowIncident?.opened_at && (
      <p className="text-xs text-white/60">
        {new Date(selectedServiceNowIncident.opened_at).toLocaleString()}
      </p>
    )}
  </div>

  <div className="min-h-[180px] flex-1">
    {!selectedServiceNowIncident ? (
      <p className="text-sm text-white/60">
        {serviceNowIncidentsLoading
          ? "Loading incident details…"
          : "Click on an incident to see its details."}
      </p>
    ) : (
      <ScrollArea className="h-[520px] lg:h-[460px] pr-3">
        <div className="space-y-4">
          {/* Incident title + short description */}
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/60">Incident ID:</span>
              <span className="font-semibold text-white">
                {selectedServiceNowIncident.number ?? "Unknown incident"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/60">Description:</span>
              <span className="text-white/80">
                {selectedServiceNowIncident.short_description ?? "No description provided."}
              </span>
            </div>
          </div>

          {/* Table-style incident fields */}
          {(() => {
            const preferredOrder = [
              "number",
              "short_description",
              "status",
              "state",
              "category",
              "u_ai_category",
              "notify",
              "opened_at",
              "closed_at",
              "close_notes",
              "sys_id"
            ];

            const keys = Object.keys(selectedServiceNowIncident);
            const orderedKeys = [
              ...preferredOrder.filter((k) => keys.includes(k)),
              ...keys.filter((k) => !preferredOrder.includes(k))
            ];

            return (
              <div className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
                {/* Section header */}
                <div className="border-b border-white/5 px-4 py-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Incident fields
                  </h4>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 text-[11px] uppercase tracking-[0.12em] text-white/60">
                        <th className="px-4 py-3 text-left">Field</th>
                        <th className="px-4 py-3 text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orderedKeys.map((key) => (
                        <tr
                          key={key}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-white/70">
                            {formatKey(key)}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/90 break-words">
                            <IncidentValue
                              value={(selectedServiceNowIncident as any)[key]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </ScrollArea>
    )}
  </div>
</Card>

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
