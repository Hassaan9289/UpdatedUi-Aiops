'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";

const mcpPillars = [
  { name: "Automation Studio", detail: "Workflows orchestrated: 38", status: "active" },
  { name: "Observability Mesh", detail: "Streams processed: 1.2M/min", status: "active" },
  { name: "Governance", detail: "Policies applied: 24", status: "caution" },
];

const mcpStatusVariant: Record<string, "success" | "warning"> = {
  active: "success",
  caution: "warning",
};

export default function McpPage() {
  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator"]}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-title">MCP</p>
              <p className="text-sm text-white/60">
                Multi-cloud platform controls and automations managed centrally.
              </p>
            </div>
            <Button variant="outline" className="px-4 py-2 text-sm">
              Review playbooks
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {mcpPillars.map((pillar) => (
              <Card key={pillar.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{pillar.name}</h3>
                  <Badge variant={mcpStatusVariant[pillar.status]} className="capitalize">
                    {pillar.status}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">{pillar.detail}</p>
              </Card>
            ))}
          </div>
        </section>
      </RequireRole>
    </AuthGate>
  );
}
