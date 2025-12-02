export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "open" | "diagnosing" | "mitigating" | "resolved";

export interface ServiceHealth {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  owner: string;
}

export interface Anomaly {
  id: string;
  serviceId: string;
  metric: string;
  value: number;
  baseline: number;
  detectedAt: string;
  severity: Severity;
  confidence: number;
  why: string;
}

export interface Incident {
  id: string;
  serviceId: string;
  title: string;
  severity: Severity;
  detectedAt: string;
  status: Status;
  rootCause?: string;
  confidence?: number;
  impactedUsers?: number;
  relatedChangeId?: string;
}

export interface Runbook {
  id: string;
  name: string;
  category: string;
  trigger: "manual" | "auto";
  lastExecutedAt?: string;
  successRate: number;
}

export interface Execution {
  id: string;
  runbookId: string;
  incidentId?: string;
  startedAt: string;
  status: "success" | "failed" | "skipped" | "pending-approval";
  log: string[];
}

export interface TopologyNode {
  id: string;
  label: string;
  kind: "svc" | "db" | "cache" | "queue" | "infra";
  health: "ok" | "warn" | "err";
}

export interface TopologyEdge {
  from: string;
  to: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  summary: string;
  type: "deploy" | "incident" | "signal" | "automation";
}

export interface Connector {
  id: string;
  name: string;
  status: "connected" | "warning" | "error";
  lastSync: string;
  description: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  serviceId: string;
  summary: string;
  resolvedAt: string;
  takeaways: string[];
}

export interface Playbook {
  id: string;
  name: string;
  owner: string;
  steps: string[];
}

export interface ChatAction {
  label: string;
  action: "ticket" | "approve" | "suppress";
}

export interface ChatMessage {
  id: string;
  author: "system" | "ai" | "operator";
  text: string;
  timestamp: string;
  actions?: ChatAction[];
}

export interface Insight {
  id: string;
  title: string;
  detail: string;
  why: string;
  impact: string;
}

export interface ChangeRisk {
  id: string;
  serviceId: string;
  deployedAt: string;
  riskScore: number;
  owner: string;
  notes: string;
}
