'use client';

import { ReactNode } from "react";
import { useSessionStore } from "@/lib/auth/session";
import { Role } from "@/lib/auth/rbac";
import { Denied } from "./Denied";

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const role = useSessionStore((state) => state.user?.role ?? null);
  const hydrated = useSessionStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-white/60">
        Checking access…
      </div>
    );
  }

  if (!role || !roles.includes(role)) {
    return <Denied />;
  }

  return <>{children}</>;
}
