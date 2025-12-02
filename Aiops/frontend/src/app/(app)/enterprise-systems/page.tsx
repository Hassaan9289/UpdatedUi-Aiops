'use client';

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";

const connectors = [
  {
    name: "MuleSoft",
    description:
      "Unified API management, integration flows, and secure connectivity into SaaS and on-prem systems.",
    highlight: "Secure onboarding",
    logo: "/logos/Mulesoft-02.png",
  },
  {
    name: "Salesforce",
    description:
      "Sync CRM data, cases, and automation workflows across customer success, ITSM, and analytics platforms.",
    highlight: "Customer 360 ready",
    logo: "/logos/salesforce-img.png",
  },
  {
    name: "SAP",
    description:
      "Connect ERP, finance, and supply-chain processes with resilient automation guardrails and observability.",
    highlight: "Enterprise grade",
    logo: "/logos/SAP-img.png",
  },
];

export default function EnterpriseSystemsPage() {
  const [selected, setSelected] = useState<typeof connectors[number] | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const formTitle = useMemo(() => (selected ? `Connect ${selected.name}` : ""), [selected]);

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator", "executive", "observer"]}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-title">Enterprise systems</p>
              <p className="text-sm text-white/60">
                Connect flagship enterprise systems to power unified automations across your tenant.
              </p>
            </div>
            <Button variant="ghost" className="px-4 py-2 text-sm">
              Browse connectors
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {connectors.map((connector) => (
              <Card
                key={connector.name}
                className="space-y-4 border border-white/5 bg-white/5 p-5 transition hover:border-[var(--accent)] hover:bg-[var(--card)]"
                onClick={() => setSelected(connector)}
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge >
                    Enterprise connector
                  </Badge>
                  <div className="flex h-12 w-20 items-center justify-center rounded-lg ">
                    <img
                      src={connector.logo}
                      alt={`${connector.name} logo`}
                      width={80}
                      height={40}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{connector.name}</h3>
                  <p className="text-sm text-white/60">{connector.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="success" className="rounded-full px-3 text-xs">
                    Secure
                  </Badge>
                  <p className="text-sm text-white/50">{connector.highlight}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
            <Card className="w-full max-w-md rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">{selected.name && formTitle}</p>
                  <h2 className="text-2xl font-semibold text-white">{formTitle}</h2>
                  <p className="text-xs text-white/50">
                    Provide platform credentials to establish a secure integration.
                  </p>
                </div>
                <button
                  className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <label className="space-y-1 text-xs text-white/60">
                  <span>User ID</span>
                  <input
                    type="email"
                    placeholder="integration_user@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <label className="space-y-1 text-xs text-white/60">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="••••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <label className="space-y-1 text-xs text-white/60">
                  <span>Environment</span>
                  <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[var(--accent)]">
                    <option>Sandbox</option>
                    <option>Production</option>
                    <option>Staging</option>
                  </select>
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-white">MFA Enabled</p>
                    <p className="text-xs text-white/50">
                      Require OAuth client credentials when multi-factor authentication is active.
                    </p>
                  </div>
                  <button
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      mfaEnabled ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/30"
                    }`}
                    onClick={() => setMfaEnabled((prev) => !prev)}
                    type="button"
                  >
                    {mfaEnabled ? "On" : "Off"}
                  </button>
                </div>
                {mfaEnabled && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Client ID</span>
                      <input
                        type="text"
                        placeholder="Paste OAuth client ID"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Client Secret</span>
                      <input
                        type="text"
                        placeholder="Paste OAuth client secret"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <Button variant="ghost" className="rounded-full border border-white/10 px-4 py-2 text-sm" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button variant="default" className="rounded-full px-4 py-2 text-sm">
                  Submit
                </Button>
              </div>
            </Card>
          </div>
        )}
      </RequireRole>
    </AuthGate>
  );
}
