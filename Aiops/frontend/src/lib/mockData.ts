import {
  Anomaly,
  ChangeRisk,
  ChatMessage,
  Connector,
  Execution,
  Incident,
  Insight,
  KnowledgeEntry,
  Playbook,
  Runbook,
  ServiceHealth,
  TimelineEvent,
  TopologyEdge,
  TopologyNode,
} from "./types";

export const services: ServiceHealth[] = [
  { id: "svc-payments", name: "Payments API", status: "degraded", owner: "FinOps" },
  { id: "svc-checkout", name: "Checkout", status: "healthy", owner: "Commerce" },
  { id: "svc-inventory", name: "Inventory", status: "healthy", owner: "SupplyChain" },
  { id: "svc-search", name: "Search", status: "degraded", owner: "Core" },
  { id: "svc-notify", name: "Notifications", status: "healthy", owner: "Engage" },
  { id: "svc-agents", name: "AI Agent Hub", status: "down", owner: "Platform" },
];

export const anomalies: Anomaly[] = [
  {
    id: "anm-214",
    serviceId: "svc-payments",
    metric: "Latency p95",
    value: 820,
    baseline: 420,
    detectedAt: "2025-11-10T15:05:00Z",
    severity: "high",
    confidence: 0.87,
    why: "Latency doubled within 8 minutes following DB connection-pool saturation coinciding with a deployment to Payments API pods.",
  },
  {
    id: "anm-215",
    serviceId: "svc-agents",
    metric: "Error Rate",
    value: 7.2,
    baseline: 1.1,
    detectedAt: "2025-11-10T14:40:00Z",
    severity: "critical",
    confidence: 0.93,
    why: "Spike in gRPC UNAVAILABLE errors from AI Agent Hub workers after redis queue depth exceeded adaptive thresholds.",
  },
  {
    id: "anm-208",
    serviceId: "svc-search",
    metric: "CPU Utilization",
    value: 92,
    baseline: 63,
    detectedAt: "2025-11-10T13:55:00Z",
    severity: "medium",
    confidence: 0.74,
    why: "Search indexer nodes sharing compute pool with Payments DB saw CPU climb in lockstep with nightly re-index job.",
  },
];

export const incidents: Incident[] = [
  {
    id: "INC-4921",
    serviceId: "svc-payments",
    title: "Payments latency impacting checkout",
    severity: "high",
    detectedAt: "2025-11-10T14:58:00Z",
    status: "diagnosing",
    rootCause: "DB connection pool exhaustion",
    confidence: 0.81,
    impactedUsers: 4200,
    relatedChangeId: "CHG-1884",
  },
  {
    id: "INC-4916",
    serviceId: "svc-agents",
    title: "AI Agent Hub queue stalled",
    severity: "critical",
    detectedAt: "2025-11-10T14:30:00Z",
    status: "mitigating",
    rootCause: "Redis shard contention",
    confidence: 0.76,
    impactedUsers: 1800,
    relatedChangeId: "CHG-1880",
  },
  {
    id: "INC-4902",
    serviceId: "svc-search",
    title: "Search relevance drift alerts",
    severity: "medium",
    detectedAt: "2025-11-09T22:10:00Z",
    status: "resolved",
    rootCause: "Stale embeddings",
    confidence: 0.69,
    impactedUsers: 800,
  },
];

export const runbooks: Runbook[] = [
  {
    id: "RBK-41",
    name: "Recycle payments DB connections",
    category: "Database",
    trigger: "auto",
    lastExecutedAt: "2025-11-10T15:08:00Z",
    successRate: 0.94,
  },
  {
    id: "RBK-07",
    name: "Scale Agent Hub workers",
    category: "Platform",
    trigger: "manual",
    lastExecutedAt: "2025-11-10T14:42:00Z",
    successRate: 0.88,
  },
  {
    id: "RBK-18",
    name: "Refresh search embeddings",
    category: "ML Ops",
    trigger: "auto",
    lastExecutedAt: "2025-11-09T22:15:00Z",
    successRate: 0.9,
  },
  {
    id: "RBK-55",
    name: "Purge stuck notifications",
    category: "Messaging",
    trigger: "auto",
    lastExecutedAt: "2025-11-10T10:12:00Z",
    successRate: 0.97,
  },
];

export const executions: Execution[] = [
  {
    id: "EXE-930",
    runbookId: "RBK-41",
    incidentId: "INC-4921",
    startedAt: "2025-11-10T15:08:00Z",
    status: "success",
    log: [
      "Detected saturation on payments-db primary.",
      "Drained idle connections.",
      "Rebalanced read replicas.",
      "Verified latency recovery.",
    ],
  },
  {
    id: "EXE-928",
    runbookId: "RBK-07",
    incidentId: "INC-4916",
    startedAt: "2025-11-10T14:41:00Z",
    status: "pending-approval",
    log: ["Requested scale-out to 2x workers.", "Waiting for operator approval."],
  },
  {
    id: "EXE-927",
    runbookId: "RBK-18",
    startedAt: "2025-11-09T22:11:00Z",
    status: "success",
    log: ["Queued embedding refresh.", "Backfilled cache.", "Validated latency < 200ms."],
  },
];

export const topologyNodes: TopologyNode[] = [
  { id: "svc-payments", label: "Payments API", kind: "svc", health: "warn" },
  { id: "db-payments", label: "Payments DB", kind: "db", health: "err" },
  { id: "svc-checkout", label: "Checkout", kind: "svc", health: "ok" },
  { id: "svc-agents", label: "AI Agents", kind: "svc", health: "err" },
  { id: "queue-agents", label: "Agent Queue", kind: "queue", health: "warn" },
  { id: "cache-session", label: "Session Cache", kind: "cache", health: "ok" },
  { id: "svc-search", label: "Search", kind: "svc", health: "warn" },
  { id: "svc-notify", label: "Notifications", kind: "svc", health: "ok" },
];

export const topologyEdges: TopologyEdge[] = [
  { from: "svc-checkout", to: "svc-payments" },
  { from: "svc-payments", to: "db-payments" },
  { from: "svc-payments", to: "svc-notify" },
  { from: "svc-agents", to: "queue-agents" },
  { from: "queue-agents", to: "svc-notify" },
  { from: "svc-checkout", to: "svc-search" },
  { from: "svc-search", to: "cache-session" },
  { from: "svc-agents", to: "svc-payments" },
];

export const timeline: TimelineEvent[] = [
  {
    id: "TIM-1",
    timestamp: "2025-11-10T14:25:00Z",
    summary: "Canary deploy CHG-1880 started in us-east-1",
    type: "deploy",
  },
  {
    id: "TIM-2",
    timestamp: "2025-11-10T14:30:00Z",
    summary: "Incident INC-4916 opened for AI Agent Hub queue depth",
    type: "incident",
  },
  {
    id: "TIM-3",
    timestamp: "2025-11-10T14:42:00Z",
    summary: "Runbook RBK-07 requested manual approval",
    type: "automation",
  },
  {
    id: "TIM-4",
    timestamp: "2025-11-10T14:58:00Z",
    summary: "Incident INC-4921 created from anomaly ANM-214",
    type: "incident",
  },
  {
    id: "TIM-5",
    timestamp: "2025-11-10T15:08:00Z",
    summary: "Automation RBK-41 completed successfully",
    type: "automation",
  },
];

export const connectors: Connector[] = [
  {
    id: "mulesoft",
    name: "MuleSoft",
    status: "connected",
    lastSync: "10m ago",
    description: "API & data integration across systems.",
  },
  {
    id: "srvnow",
    name: "ServiceNow",
    status: "connected",
    lastSync: "5m ago",
    description: "Incident & change bi-directional sync.",
  },
  {
    id: "slack",
    name: "Slack",
    status: "connected",
    lastSync: "Streaming",
    description: "ChatOps bridge for responders.",
  },
  {
    id: "datadog",
    name: "DataDog",
    status: "connected",
    lastSync: "2m ago",
    description: "Cloud monitoring & observability platform.",
  },
  {
    id: "cloudwatch",
    name: "CloudWatch",
    status: "warning",
    lastSync: "18m ago",
    description: "AWS telemetry collector.",
  },
  {
    id: "dynatrace",
    name: "Dynatrace",
    status: "connected",
    lastSync: "2m ago",
    description: "APM traces & topology sync.",
  },
];

export const knowledgeEntries: KnowledgeEntry[] = [
  {
    id: "KB-330",
    title: "Payments DB connection storm",
    serviceId: "svc-payments",
    summary: "Detected surge due to mis-sized pool, resolved by draining long-running queries and rebalancing replicas.",
    resolvedAt: "2025-09-18T08:00:00Z",
    takeaways: [
      "Enable adaptive pool sizing.",
      "Alert on connection reuse ratio.",
    ],
  },
  {
    id: "KB-318",
    title: "Agent Hub stuck queue",
    serviceId: "svc-agents",
    summary: "Worker pods throttled by CPU quotas causing backlog; auto-scaler patch applied.",
    resolvedAt: "2025-08-02T18:00:00Z",
    takeaways: [
      "Pre-validate quotas for nightly campaigns.",
      "Shift inference jobs off shared nodes.",
    ],
  },
  {
    id: "KB-299",
    title: "Search relevance drift",
    serviceId: "svc-search",
    summary: "Embeddings stale due to missing retrain trigger on schema change.",
    resolvedAt: "2025-07-22T11:00:00Z",
    takeaways: ["Add schema hook to pipeline.", "Shorten TTL to 4h."],
  },
];

export const playbooks: Playbook[] = [
  {
    id: "PB-17",
    name: "DB saturation triage",
    owner: "Site Reliability",
    steps: [
      "Validate anomaly correlation to DB metrics.",
      "Check connection pool configuration drift.",
      "Trigger RBK-41 if concurrency > 80%.",
    ],
  },
  {
    id: "PB-22",
    name: "Queue flush recovery",
    owner: "Platform Ops",
    steps: [
      "Snapshot queue depth & inflight jobs.",
      "Fan-out additional workers.",
      "Notify stakeholders via ChatOps channel.",
    ],
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: "MSG-1",
    author: "system",
    text: "INC-4921 promoted to Sev-2. Payments squad paged.",
    timestamp: "2025-11-10T15:00:00Z",
  },
  {
    id: "MSG-2",
    author: "ai",
    text: "Recommended executing RBK-41 (connection recycle). Confidence 82%.",
    timestamp: "2025-11-10T15:01:00Z",
    actions: [
      { label: "Approve runbook", action: "approve" },
      { label: "Create ticket", action: "ticket" },
    ],
  },
  {
    id: "MSG-3",
    author: "operator",
    text: "Approving RBK-41 for production. Watching latency.",
    timestamp: "2025-11-10T15:02:00Z",
  },
  {
    id: "MSG-4",
    author: "ai",
    text: "Latency trending down 38% over last 4 minutes.",
    timestamp: "2025-11-10T15:06:00Z",
    actions: [{ label: "Suppress alert", action: "suppress" }],
  },
];

export const insights: Insight[] = [
  {
    id: "INS-1",
    title: "Checkout impact from Payments saturation",
    detail: "47% of checkout latency variance explained by Payments DB queue buildup.",
    why: "Granger test across 3 days shows Payments DB wait time leading Checkout p95 by 6 minutes.",
    impact: "MTTR improved by 18 mins when RBK-41 auto-triggered last quarter.",
  },
  {
    id: "INS-2",
    title: "AI Agent Hub stuck approvals",
    detail: "Four pending approvals blocking automation coverage for Agent Hub.",
    why: "Human-in-loop threshold set to 40% confidence; current signals at 74-80%.",
    impact: "Auto-approval within policy could close Sev-2 12 minutes faster.",
  },
  {
    id: "INS-3",
    title: "Noise reduction opportunity",
    detail: "12% of Prometheus alerts overlap with Dynatrace topology paths.",
    why: "Correlated by shared host tags + identical derivative metrics.",
    impact: "Apply dedupe policy to reclaim ~140 engineer-minutes weekly.",
  },
];

export const changeRisks: ChangeRisk[] = [
  {
    id: "CHG-1884",
    serviceId: "svc-payments",
    deployedAt: "2025-11-10T14:45:00Z",
    riskScore: 0.71,
    owner: "FinOps",
    notes: "Connection timeout reduced during hotfix.",
  },
  {
    id: "CHG-1880",
    serviceId: "svc-agents",
    deployedAt: "2025-11-10T14:20:00Z",
    riskScore: 0.62,
    owner: "Platform",
    notes: "Queue shard rebalance in progress.",
  },
  {
    id: "CHG-1872",
    serviceId: "svc-search",
    deployedAt: "2025-11-09T10:00:00Z",
    riskScore: 0.25,
    owner: "Core",
    notes: "Embedding schema alignment.",
  },
];

export const incidentTrend = [
  { label: "Mon", incidents: 12, aiClosed: 5 },
  { label: "Tue", incidents: 9, aiClosed: 4 },
  { label: "Wed", incidents: 11, aiClosed: 6 },
  { label: "Thu", incidents: 8, aiClosed: 5 },
  { label: "Fri", incidents: 6, aiClosed: 4 },
  { label: "Sat", incidents: 4, aiClosed: 3 },
  { label: "Sun", incidents: 5, aiClosed: 3 },
];

export const monitoringSeries = {
  latency: [
    { time: "14:00", value: 420 },
    { time: "14:10", value: 450 },
    { time: "14:20", value: 510 },
    { time: "14:30", value: 620 },
    { time: "14:40", value: 700 },
    { time: "14:50", value: 760 },
    { time: "15:00", value: 540 },
  ],
  errorRate: [
    { time: "14:00", value: 1.2 },
    { time: "14:10", value: 1.4 },
    { time: "14:20", value: 1.6 },
    { time: "14:30", value: 2.3 },
    { time: "14:40", value: 3.1 },
    { time: "14:50", value: 3.4 },
    { time: "15:00", value: 2.0 },
  ],
  cpu: [
    { time: "14:00", value: 55 },
    { time: "14:10", value: 60 },
    { time: "14:20", value: 68 },
    { time: "14:30", value: 74 },
    { time: "14:40", value: 81 },
    { time: "14:50", value: 76 },
    { time: "15:00", value: 72 },
  ],
  memory: [
    { time: "14:00", value: 60 },
    { time: "14:10", value: 64 },
    { time: "14:20", value: 69 },
    { time: "14:30", value: 73 },
    { time: "14:40", value: 78 },
    { time: "14:50", value: 82 },
    { time: "15:00", value: 77 },
  ],
};

export const analyticsSeries = {
  mttr: [
    { month: "May", value: 88 },
    { month: "Jun", value: 74 },
    { month: "Jul", value: 70 },
    { month: "Aug", value: 62 },
    { month: "Sep", value: 58 },
    { month: "Oct", value: 54 },
    { month: "Nov", value: 49 },
  ],
  noiseReduction: [
    { month: "May", value: 8 },
    { month: "Jun", value: 12 },
    { month: "Jul", value: 18 },
    { month: "Aug", value: 22 },
    { month: "Sep", value: 26 },
    { month: "Oct", value: 31 },
    { month: "Nov", value: 35 },
  ],
  automationCoverage: [
    { month: "May", value: 34 },
    { month: "Jun", value: 36 },
    { month: "Jul", value: 41 },
    { month: "Aug", value: 44 },
    { month: "Sep", value: 46 },
    { month: "Oct", value: 51 },
    { month: "Nov", value: 55 },
  ],
  recurrence: [
    { label: "Checkout", value: 3 },
    { label: "Payments", value: 5 },
    { label: "Search", value: 2 },
    { label: "Agents", value: 4 },
  ],
  costSavings: [
    { month: "Q1", automation: 120, avoidance: 80 },
    { month: "Q2", automation: 160, avoidance: 95 },
    { month: "Q3", automation: 210, avoidance: 120 },
    { month: "Q4", automation: 260, avoidance: 150 },
  ],
  topRunbooks: [
    { name: "RBK-41", value: 18 },
    { name: "RBK-07", value: 11 },
    { name: "RBK-18", value: 9 },
    { name: "RBK-55", value: 6 },
  ],
};
