'use client';

import { ReactNode } from "react";
import { Permission } from "@/lib/auth/rbac";
import { useSessionStore } from "@/lib/auth/session";

interface Props {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: Props) {
  const hydrated = useSessionStore((state) => state.hydrated);
  const allowed = useSessionStore((state) => state.can(permission));

  if (!hydrated) {
    return <>{fallback}</>;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
