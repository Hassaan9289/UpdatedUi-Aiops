import { Card } from "@/components/ui/card";

interface KpiItem {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm text-white/60">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
          <p
            className={`mt-2 text-sm ${
              item.trend === "up" ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {item.trend === "up" ? "▲" : "▼"} {item.delta}
          </p>
        </Card>
      ))}
    </div>
  );
}
