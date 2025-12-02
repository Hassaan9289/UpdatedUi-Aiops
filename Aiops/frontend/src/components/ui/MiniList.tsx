import { Card } from "./card";

interface MiniItem {
  id: string;
  title: string;
  meta: string;
  status?: "ok" | "warn" | "err";
}

export function MiniList({ title, items }: { title: string; items: MiniItem[] }) {
  return (
    <Card>
      <p className="section-title mb-4">{title}</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-none border border-white/5 bg-white/[0.02] px-3 py-2"
            aria-label={`${item.title} ${item.meta}`}
          >
            <div>
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="text-xs text-white/60">{item.meta}</p>
            </div>
            {item.status && (
              <span
                className={`h-2 w-2 rounded-full ${
                  item.status === "ok"
                    ? "bg-emerald-400"
                    : item.status === "warn"
                      ? "bg-amber-400"
                      : "bg-rose-400"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
