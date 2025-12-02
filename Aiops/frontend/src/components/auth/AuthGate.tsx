'use client';

import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "@/lib/auth/session";

export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const hydrated = useSessionStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated && !user) {
      navigate("/login", { replace: true });
    }
  }, [hydrated, user, navigate]);

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-white/60">
        Loading secure workspace…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-white/60">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
