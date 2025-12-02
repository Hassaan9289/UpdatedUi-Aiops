'use client';

import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from "react";
import { TopologyEdge, TopologyNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  selectedId?: string;
  onSelect?: (node: TopologyNode) => void;
  height?: number;
}

const kindColor: Record<TopologyNode["kind"], string> = {
  svc: "#60a5fa",
  db: "#f472b6",
  cache: "#fbbf24",
  queue: "#34d399",
  infra: "#a78bfa",
};

const healthStroke: Record<TopologyNode["health"], string> = {
  ok: "#22c55e",
  warn: "#facc15",
  err: "#f87171",
};

export function TopologyCanvas({
  nodes,
  edges,
  selectedId,
  onSelect,
  height = 420,
}: Props) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const positions = useMemo(() => {
    return nodes.map((node, idx) => {
      const angle = (idx / nodes.length) * Math.PI * 2;
      const radius = 120 + (node.kind === "db" ? 30 : 0);
      return {
        node,
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
      };
    });
  }, [nodes]);

  const findPosition = (id: string) =>
    positions.find((entry) => entry.node.id === id);

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setTransform((prev) => {
      const scale = Math.min(2.5, Math.max(0.6, prev.scale - event.deltaY * 0.001));
      return { ...prev, scale };
    });
  };

  const handleMouseDown = (event: ReactMouseEvent<SVGSVGElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    const last = dragRef.current;
    if (!last) return;
    const deltaX = event.clientX - last.x;
    const deltaY = event.clientY - last.y;
    setTransform((prev) => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#050816] to-[#0b1224]"
      style={{ height }}
    >
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full cursor-grab"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          {edges.map((edge) => {
            const from = findPosition(edge.from);
            const to = findPosition(edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
              />
            );
          })}
          {positions.map(({ node, x, y }) => (
            <g key={node.id} transform={`translate(${x}, ${y})`}>
              <circle
                r={selectedId === node.id ? 22 : 18}
                fill={`${kindColor[node.kind]}22`}
                stroke={healthStroke[node.health]}
                strokeWidth={2}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect?.(node);
                }}
              />
              <text
                textAnchor="middle"
                y={5}
                fill="rgba(255,255,255,0.9)"
                className={cn("text-[10px] font-semibold drop-shadow pointer-events-none select-none")}
              >
                {node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
