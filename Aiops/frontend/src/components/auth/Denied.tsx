'use client';

import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Denied() {
  return (
    <Card className="flex flex-col items-center text-center">
      <ShieldAlert className="h-10 w-10 text-rose-400" />
      <h3 className="mt-4 text-xl font-semibold">You don&apos;t have access to this area</h3>
      <p className="mt-2 text-sm text-white/60">
        Switch to an authorized role or contact the platform admin to request access.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </Card>
  );
}
