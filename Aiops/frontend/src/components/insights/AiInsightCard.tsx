'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Insight } from "@/lib/types";

export function AiInsightCard({ insight }: { insight: Insight }) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <Card className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-300">AI Insight</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{insight.title}</h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle why"
          onClick={() => setShowWhy((prev) => !prev)}
        >
          <ChevronDown
            className={`h-4 w-4 transition ${showWhy ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
      <p className="mt-3 text-sm text-white/70">{insight.detail}</p>
      <p className="mt-4 text-sm text-emerald-300">{insight.impact}</p>
      {showWhy && (
        <div className="mt-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 text-sm text-white/80">
          <p className="font-medium text-indigo-200 mb-1">Why this?</p>
          <p>{insight.why}</p>
        </div>
      )}
    </Card>
  );
}
