'use client';

import { useMemo } from "react";
import { useAIOpsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

const colorMap = {
  system: "bg-purple-500/20 border border-purple-500/30",
  ai: "bg-indigo-500/10 border border-indigo-500/30",
  operator: "bg-white/5 border border-white/10",
};

export function ChatFeed() {
  const messages = useAIOpsStore((state) => state.chatMessages);
  const addChatMessage = useAIOpsStore((state) => state.addChatMessage);
  const approve = useAIOpsStore((state) => state.approveRunbook);
  const executions = useAIOpsStore((state) => state.executions);

  const pendingExecutions = useMemo(
    () => executions.filter((exe) => exe.status === "pending-approval"),
    [executions],
  );
  const lastPending = pendingExecutions.at(0);

  const handleAction = (action: string) => {
    if (action === "approve" && lastPending) {
      approve(lastPending.id);
      addChatMessage({
        id: crypto.randomUUID(),
        author: "operator",
        text: `Approved ${lastPending.runbookId} directly from ChatOps.`,
        timestamp: new Date().toISOString(),
      });
    }
    if (action === "ticket") {
      addChatMessage({
        id: crypto.randomUUID(),
        author: "system",
        text: "Created ServiceNow ticket TK-4021 linked to INC-4921.",
        timestamp: new Date().toISOString(),
      });
    }
    if (action === "suppress") {
      addChatMessage({
        id: crypto.randomUUID(),
        author: "system",
        text: "Suppressed duplicate Prometheus alert for 30 minutes.",
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-3xl p-4 text-sm text-white/80 ${colorMap[message.author]}`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
            <span>{message.author}</span>
            <span>{formatDate(message.timestamp, "HH:mm")}</span>
          </div>
          <p className="mt-2 text-base text-white">{message.text}</p>
          {message.actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actions.map((action) => (
                <Button
                  key={action.label}
                  variant="muted"
                  size="sm"
                  onClick={() => handleAction(action.action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
