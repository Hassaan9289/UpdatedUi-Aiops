'use client';

import { connectors } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";

const statusColor: Record<string, "success" | "warning" | "danger"> = {
  connected: "success",
  warning: "warning",
  error: "danger",
};

export default function ConnectorsPage() {
  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator", "executive"]}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {connectors.map((connector) => (
            <Card key={connector.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{connector.name}</h3>
                  <p className="text-sm text-white/60">{connector.description}</p>
                </div>
                <Badge variant={statusColor[connector.status]}>
                  {connector.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-white/50">Last sync · {connector.lastSync}</p>
              <Button variant="muted" className="w-full">
                Manage connector
              </Button>
            </Card>
          ))}
        </div>
      </RequireRole>
    </AuthGate>
  );
}
