'use client';

import { create } from "zustand";
import { produce } from "immer";
import {
  anomalies as initialAnomalies,
  changeRisks,
  chatMessages,
  connectors,
  executions as initialExecutions,
  incidents as initialIncidents,
  insights,
  knowledgeEntries,
  playbooks,
  runbooks as initialRunbooks,
  services as initialServices,
  timeline,
  topologyEdges,
  topologyNodes,
} from "./mockData";
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

export interface AIOpsState {
  services: ServiceHealth[];
  anomalies: Anomaly[];
  incidents: Incident[];
  runbooks: Runbook[];
  executions: Execution[];
  connectors: Connector[];
  knowledgeEntries: KnowledgeEntry[];
  playbooks: Playbook[];
  timeline: TimelineEvent[];
  topologyNodes: TopologyNode[];
  topologyEdges: TopologyEdge[];
  insights: Insight[];
  changeRisks: ChangeRisk[];
  chatMessages: ChatMessage[];
  addIncident: (incident: Incident) => void;
  resolveIncident: (id: string) => void;
  approveRunbook: (executionId: string) => void;
  injectAnomaly: (payload: Omit<Anomaly, "id" | "detectedAt">) => void;
  linkChange: (incidentId: string, changeId: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateServiceStatus: (serviceId: string, status: ServiceHealth["status"]) => void;
  rejectRunbook: (executionId: string) => void;
}

const createId = (prefix: string) =>
  `${prefix}-${Math.floor(Date.now() / 1000).toString(36)}`;

export const useAIOpsStore = create<AIOpsState>()((set) => ({
  services: initialServices,
  anomalies: initialAnomalies,
  incidents: initialIncidents,
  runbooks: initialRunbooks,
  executions: initialExecutions,
  connectors,
  knowledgeEntries,
  playbooks,
  timeline,
  topologyNodes,
  topologyEdges,
  insights,
  changeRisks,
  chatMessages,
  addIncident: (incident) =>
    set(
      produce<AIOpsState>((state) => {
        state.incidents.unshift(incident);
      }),
    ),
  resolveIncident: (id) =>
    set(
      produce<AIOpsState>((state) => {
        const incident = state.incidents.find((item) => item.id === id);
        if (incident) {
          incident.status = "resolved";
          incident.confidence = Math.min(1, (incident.confidence ?? 0.5) + 0.1);
        }
      }),
    ),
  approveRunbook: (executionId) =>
    set(
      produce<AIOpsState>((state) => {
        const execution = state.executions.find((item) => item.id === executionId);
        if (execution) {
          execution.status = "success";
          execution.log.push("Operator approved via ChatOps.");
          const runbook = state.runbooks.find((r) => r.id === execution.runbookId);
          if (runbook) {
            runbook.trigger = "auto";
            runbook.lastExecutedAt = new Date().toISOString();
            runbook.successRate = Math.min(0.99, runbook.successRate + 0.01);
          }
        }
      }),
    ),
  injectAnomaly: (payload) =>
    set(
      produce<AIOpsState>((state) => {
        const id = createId("ANM");
        state.anomalies.unshift({
          ...payload,
          id,
          detectedAt: new Date().toISOString(),
        });
      }),
    ),
  linkChange: (incidentId, changeId) =>
    set(
      produce<AIOpsState>((state) => {
        const incident = state.incidents.find((item) => item.id === incidentId);
        if (incident) {
          incident.relatedChangeId = changeId;
        }
      }),
    ),
  addChatMessage: (message) =>
    set(
      produce<AIOpsState>((state) => {
        state.chatMessages.push(message);
      }),
    ),
  updateServiceStatus: (serviceId, status) =>
    set(
      produce<AIOpsState>((state) => {
        const svc = state.services.find((item) => item.id === serviceId);
        if (svc) {
          svc.status = status;
        }
      }),
    ),
  rejectRunbook: (executionId) =>
    set(
      produce<AIOpsState>((state) => {
        const execution = state.executions.find((item) => item.id === executionId);
        if (execution) {
          execution.status = "skipped";
          execution.log.push("Operator rejected via Automation panel.");
        }
      }),
    ),
}));
