'use client';

import { Incident } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

const severityMap: Record<Incident["severity"], string> = {
  critical: "text-rose-300",
  high: "text-amber-300",
  medium: "text-sky-300",
  low: "text-emerald-300",
};

interface Props {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
  activeId?: string;
}

export function IncidentTable({ incidents, onSelect, activeId }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-white/50">
          <TableHead>ID</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Detected</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.map((incident) => (
          <TableRow
            key={incident.id}
            onClick={() => onSelect(incident)}
            className={cn(
              "cursor-pointer",
              activeId === incident.id && "bg-white/5",
            )}
          >
            <TableCell className="font-semibold">{incident.id}</TableCell>
            <TableCell>{incident.title}</TableCell>
            <TableCell className={severityMap[incident.severity]}>
              {incident.severity.toUpperCase()}
            </TableCell>
            <TableCell>{formatDate(incident.detectedAt)}</TableCell>
            <TableCell className="capitalize text-white/70">
              {incident.status}
            </TableCell>
            <TableCell>{Math.round((incident.confidence ?? 0) * 100)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
