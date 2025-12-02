import type { ReactNode } from "react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down";
  caption?: string;
  icon?: ReactNode;
}

export function KpiCard({
  label,
  value,
  delta,
  caption,
  trend = "up",
  icon,
}: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>{label}</span>
        {icon && <span className="text-white/40">{icon}</span>}
      </div>
      <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
      {delta && (
        <p
          className={cn(
            "mt-2 text-sm",
            trend === "up" ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {trend === "up" ? "▲" : "▼"} {delta}
        </p>
      )}
      {caption && <p className="mt-3 text-sm text-white/60">{caption}</p>}
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </Card>
  );
}
