'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAIOpsStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { Can } from "@/components/auth/Can";

export function ApprovalPanel() {
  const executions = useAIOpsStore((state) => state.executions);
  const approveRunbook = useAIOpsStore((state) => state.approveRunbook);
  const rejectRunbook = useAIOpsStore((state) => state.rejectRunbook);
  const runbooks = useAIOpsStore((state) => state.runbooks);

  const pending = executions
    .filter((exe) => exe.status === "pending-approval")
    .map((exe) => ({
      ...exe,
      runbook: runbooks.find((rbk) => rbk.id === exe.runbookId),
    }));

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Human-in-the-loop</p>
          <h3 className="text-xl font-semibold text-white">
            {pending.length} approvals waiting
          </h3>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {pending.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold">{item.runbook?.name}</p>
                <p className="text-white/60">
                  Incident {item.incidentId ?? "N/A"} · {formatDate(item.startedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => rejectRunbook(item.id)}>
                  Reject
                </Button>
                <Can
                  permission="approve:automation"
                  fallback={
                    <Button
                      disabled
                      variant="muted"
                      title="Requires Operator or Admin"
                    >
                      Approve
                    </Button>
                  }
                >
                  <Button onClick={() => approveRunbook(item.id)}>Approve</Button>
                </Can>
              </div>
            </div>
            <p className="mt-3 text-white/70">{item.log.at(-1)}</p>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-white/60">No approvals required.</p>
        )}
      </div>
    </Card>
  );
}
