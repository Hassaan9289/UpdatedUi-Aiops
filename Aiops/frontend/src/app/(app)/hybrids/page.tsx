'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";

const metrics = [
  { label: "Total servers", value: "0", helper: "Tracked in the hybrid estate" },
  { label: "Online", value: "0", helper: "Agents communicating" },
  { label: "Last synced", value: "—", helper: "Awaiting first heartbeat" },
];

export default function HybridsPage() {
  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator", "executive"]}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-title">Hybrid infrastructure</p>
              <p className="text-sm text-white/60">
                Bridge on-prem and cloud workloads, monitor posture, and coordinate secure connectivity.
              </p>
            </div>
            <Button variant="default" className="px-4 py-2 text-sm">
              Add new server
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label} className="space-y-2 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-white/40">{metric.label}</p>
                <p className="text-3xl font-semibold text-white">{metric.value}</p>
                <p className="text-xs text-white/50">{metric.helper}</p>
              </Card>
            ))}
          </div>

          <Card className="border-dashed border border-white/20 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/10 text-[var(--text)]">
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold">+</span>
            </div>
            <h3 className="text-xl font-semibold text-white">No hybrid servers configured yet.</h3>
            <p className="mt-2 text-sm text-white/50">
              Use “Add new server” to register hybrid assets and manage connectivity policies.
            </p>
          </Card>
        </section>
      </RequireRole>
    </AuthGate>
  );
}
