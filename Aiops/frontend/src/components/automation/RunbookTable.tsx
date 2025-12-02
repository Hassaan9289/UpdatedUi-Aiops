'use client';

import { Runbook } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { toast } from "sonner";

interface Props {
  runbooks: Runbook[];
}

export function RunbookTable({ runbooks }: Props) {
  const handleRun = (runbook: Runbook) => {
    toast.success(`Runbook ${runbook.name} triggered`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="text-white/50">
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead>Last run</TableHead>
          <TableHead>Success</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runbooks.map((runbook) => (
          <TableRow key={runbook.id}>
            <TableCell className="font-semibold text-white">{runbook.name}</TableCell>
            <TableCell>{runbook.category}</TableCell>
            <TableCell className="capitalize">{runbook.trigger}</TableCell>
            <TableCell>
              {runbook.lastExecutedAt ? formatDate(runbook.lastExecutedAt) : "—"}
            </TableCell>
            <TableCell>{Math.round(runbook.successRate * 100)}%</TableCell>
            <TableCell>
              <Can
                permission="run:automation"
                fallback={
                  <Button
                    size="sm"
                    variant="muted"
                    disabled
                    title="Requires Operator or Admin"
                  >
                    Run
                  </Button>
                }
              >
                <Button size="sm" onClick={() => handleRun(runbook)}>
                  Run
                </Button>
              </Can>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
