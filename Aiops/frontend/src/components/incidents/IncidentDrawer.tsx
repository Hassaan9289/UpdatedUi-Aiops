'use client';

import { useState } from "react";
import { X } from "lucide-react";
import { Incident, Anomaly, TimelineEvent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  incident?: Incident;
  anomalies: Anomaly[];
  events: TimelineEvent[];
  onClose: () => void;
}

const severityVariant = {
  critical: "danger",
  high: "warning",
  medium: "default",
  low: "success",
} as const;

export function IncidentDrawer({ incident, anomalies, events, onClose }: Props) {
  const [expandWhy, setExpandWhy] = useState(false);

  if (!incident) return null;

  const relatedAlerts = anomalies.filter((a) => a.serviceId === incident.serviceId);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col rounded-l-3xl border-l border-white/5 bg-[var(--surface)]"
        aria-label="Incident details drawer"
      >
        <div className="flex items-start justify-between border-b border-white/5 p-6">
          <div>
            <p className="text-sm text-white/60">{incident.id}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              {incident.title}
            </h3>
            <p className="text-sm text-white/60">
              Detected {formatDate(incident.detectedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={severityVariant[incident.severity]}>
              {incident.severity.toUpperCase()}
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Close drawer" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-full px-6 py-4">
          <section className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Root cause hypothesis</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setExpandWhy((prev) => !prev)}
              >
                {expandWhy ? "Hide why" : "Why this?"}
              </Button>
            </div>
            <p className="text-base text-white">
              {incident.rootCause ?? "Signal enrichment pending"}
            </p>
            {expandWhy && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-sm text-indigo-100">
                AI agent examined correlated anomalies, change {incident.relatedChangeId ?? "Not linked"}, and identical pattern from Sept incident KB-330.
              </div>
            )}
          </section>
          <section className="mt-6">
            <h4 className="section-title mb-3">Correlated alerts</h4>
            <div className="space-y-3">
              {relatedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{alert.metric}</p>
                    <p className="text-xs text-white/60">{formatDate(alert.detectedAt)}</p>
                  </div>
                  <p className="text-xs text-white/60">Confidence {Math.round(alert.confidence * 100)}%</p>
                  <p className="mt-2 text-sm text-white/80">{alert.why}</p>
                </div>
              ))}
              {relatedAlerts.length === 0 && (
                <p className="text-sm text-white/50">No correlated alerts yet.</p>
              )}
            </div>
          </section>
          <section className="mt-6">
            <h4 className="section-title mb-3">Event timeline</h4>
            <div className="space-y-2 text-sm">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-white/60" />
                  <div>
                    <p className="text-xs text-white/50">{formatDate(event.timestamp)}</p>
                    <p className="text-white/80">{event.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Impacted users
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {incident.impactedUsers?.toLocaleString() ?? "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Confidence
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {Math.round((incident.confidence ?? 0) * 100)}%
              </p>
            </div>
          </section>
        </ScrollArea>
      </aside>
    </div>
  );
}
