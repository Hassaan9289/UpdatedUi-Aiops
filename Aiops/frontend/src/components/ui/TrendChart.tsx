'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  Legend,
} from "recharts";

interface TrendChartProps {
  data: Record<string, unknown>[];
  lines: { dataKey: string; color: string; name: string }[];
  height?: number;
}

export function TrendChart({ data, lines, height = 220 }: TrendChartProps) {
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--chart-axis)"
            tick={{ fill: "var(--chart-axis-text)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-axis)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1326",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1rem",
            }}
            labelStyle={{ color: "white" }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2.4}
              dot={false}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
