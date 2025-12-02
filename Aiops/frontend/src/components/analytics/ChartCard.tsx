import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, description, children, action }: ChartCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-title">{title}</p>
          {description && <p className="text-sm text-white/60">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
