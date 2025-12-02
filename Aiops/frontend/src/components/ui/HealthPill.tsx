import type { CSSProperties } from "react";
import { ServiceHealth } from "@/lib/types";

const statusMap: Record<
  ServiceHealth["status"],
  { label: string; style: CSSProperties }
> = {
  healthy: {
    label: "Healthy",
    style: {
      backgroundColor: "var(--status-healthy-bg)",
      color: "var(--status-healthy-text)",
      borderColor: "var(--status-healthy-border)",
    },
  },
  degraded: {
    label: "Degraded",
    style: {
      backgroundColor: "var(--status-degraded-bg)",
      color: "var(--status-degraded-text)",
      borderColor: "var(--status-degraded-border)",
    },
  },
  down: {
    label: "Down",
    style: {
      backgroundColor: "var(--status-down-bg)",
      color: "var(--status-down-text)",
      borderColor: "var(--status-down-border)",
    },
  },
};

export function HealthPill({ service }: { service: ServiceHealth }) {
  const meta = statusMap[service.status];
  return (
    <div className="flex items-center justify-between rounded-none border border-white/5 bg-[var(--card-muted)] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{service.name}</p>
        <p className="text-xs text-white/60">Owner · {service.owner}</p>
      </div>
      <span
        className="border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        style={meta.style}
      >
        {meta.label}
      </span>
    </div>
  );
}
