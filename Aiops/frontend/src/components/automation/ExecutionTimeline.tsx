'use client';

import { useAIOpsStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";

export function ExecutionTimeline() {
  const executions = useAIOpsStore((state) => state.executions);
  const runbooks = useAIOpsStore((state) => state.runbooks);

  const timeline = executions
    .slice()
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .map((exe) => ({
      ...exe,
      runbook: runbooks.find((rbk) => rbk.id === exe.runbookId),
    }));

  return (
    <Card>
      <p className="section-title mb-4">Execution history</p>
      <div className="space-y-4 text-sm">
        {timeline.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`h-3 w-3 rounded-full ${
                  item.status === "success"
                    ? "bg-emerald-400"
                    : item.status === "failed"
                      ? "bg-rose-400"
                      : item.status === "pending-approval"
                        ? "bg-amber-400"
                        : "bg-white/40"
                }`}
              />
              <span className="block h-full w-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-semibold">{item.runbook?.name}</p>
              <p className="text-white/60">
                {formatDate(item.startedAt)} · {item.status}
              </p>
              <p className="text-white/70">{item.log.at(-1)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
