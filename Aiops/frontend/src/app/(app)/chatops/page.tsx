'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";

const teamsChannel = {
  name: "Microsoft Teams",
  owner: "AI Ops Connector",
  status: "Active",
  updates: "Connect directly through Microsoft Teams for collaboration.",
  lastSynced: "Last synced 3m ago",
};

const statusVariant: Record<string, "success" | "default" | "warning" | "danger"> = {
  Active: "success",
};

export default function ChatOpsPage() {
  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator"]}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-title">ChatOps</p>
              <p className="text-sm text-white/60">Orchestrate conversations, tickets, and playbooks with automation.</p>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card className="space-y-3 border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logos/teamslogo.png" width={32} height={32} alt="Microsoft Teams" loading="lazy" />
                  <h3 className="text-lg font-semibold text-white">{teamsChannel.name}</h3>
                </div>
                <Badge variant={statusVariant[teamsChannel.status]}>{teamsChannel.status}</Badge>
              </div>
              <p className="text-sm text-white/50">Owner: {teamsChannel.owner}</p>
              <p className="text-sm text-white/60">{teamsChannel.updates}</p>
              <div className="flex items-center justify-between">
                <Button asChild variant="ghost" size="sm">
                  <a
                    href="https://teams.microsoft.com/l/app/f6405520-7907-4464-8f6e-9889e2fb7d8f"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open chat
                  </a>
                </Button>
                <p className="text-xs text-white/50">{teamsChannel.lastSynced}</p>
              </div>
            </Card>
            <Card className="space-y-3 border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logos/customweb.png" width={32} height={32} alt="Custom Web" loading="lazy" />
                  <h3 className="text-lg font-semibold text-white">Custom Web</h3>
                </div>
                <Badge variant="default">Available</Badge>
              </div>
              <p className="text-sm text-white/50">Owner: AI Ops Webhook</p>
              <p className="text-sm text-white/60">
                Launch the public Custom Web experience for tailored collaboration.
              </p>
              <div className="flex items-center justify-between">
                <Button asChild variant="ghost" size="sm">
                  <a href="/customweb.html" target="_blank" rel="noreferrer">
                    Open chat
                  </a>
                </Button>
                <p className="text-xs text-white/50">Last synced 3m ago</p>
              </div>
            </Card>
          </div>
          <p className="text-xs text-white/50">
            Microsoft Teams is available for collaboration.
          </p>
        </section>
      </RequireRole>
    </AuthGate>
  );
}
