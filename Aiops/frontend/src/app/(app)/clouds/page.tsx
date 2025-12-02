'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";

const clouds = [
  {
    name: "Amazon Web Services",
    provider: "AWS",
    description: "Global infrastructure, compute, storage, and managed services at hyperscale.",
    status: "Disconnected",
    logo: "/logos/AWS-logo.svg",
  },
  {
    name: "Microsoft Azure",
    provider: "Azure",
    description: "Enterprise cloud platform for hybrid workloads and AI innovation.",
    status: "Connected",
    logo: "/logos/MicrosoftAzure.png",
  },
  {
    name: "Google Cloud",
    provider: "GCP",
    description: "Data-first cloud with advanced analytics, ML, and serverless capabilities.",
    status: "Disconnected",
    logo: "/logos/Googe-cloud.png",
  },
  {
    name: "Oracle Cloud",
    provider: "Oracle",
    description: "Autonomous database, ERP, and mission-critical workloads built for performance.",
    status: "Disconnected",
    logo: "/logos/oracle-cloud.png",
  },
];

const statusVariant: Record<string, "default" | "success" | "warning"> = {
  Connected: "success",
  Disconnected: "warning",
};

export default function CloudsPage() {
  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator", "executive"]}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-title">Cloud footprint</p>
              <p className="text-sm text-[var(--muted)]">
                Manage enterprise cloud estates across hyperscalers. Track posture, connectivity, and open tasks.
              </p>
            </div>
            <Button variant="outline" className="px-4 py-2 text-sm">
              Add provider
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {clouds.map((cloud) => (
              <Card key={cloud.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-[var(--text)]">
                    {cloud.provider}
                  </Badge>
                  <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-white/10 p-1">
                    <img
                      src={cloud.logo}
                      alt={`${cloud.provider} logo`}
                      width={64}
                      height={40}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text)]">{cloud.name}</h3>
                  <p className="text-sm text-[var(--muted)]">{cloud.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant={statusVariant[cloud.status]} className="capitalize">
                    {cloud.status}
                  </Badge>
                  <button className="text-sm font-semibold text-[var(--text)]">View details</button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </RequireRole>
    </AuthGate>
  );
}
