import { Incident, ServiceHealth, TopologyNode, ChangeRisk } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface Props {
  node?: TopologyNode;
  services: ServiceHealth[];
  incidents: Incident[];
  changes: ChangeRisk[];
}

export function NodeDetails({ node, services, incidents, changes }: Props) {
  if (!node) {
    return (
      <Card className="h-full text-sm text-white/60">
        Select a node to view ownership, SLOs, and linked incidents.
      </Card>
    );
  }

  const svc = services.find((service) => service.id === node.id);
  const relatedIncidents = incidents.filter((incident) => incident.serviceId === node.id);
  const relatedChanges = changes.filter((change) => change.serviceId === node.id);

  const sloTarget = node.kind === "svc" ? "99.5%" : node.kind === "db" ? "99.9%" : "99.0%";
  const sloActual = node.health === "err" ? "97.4%" : node.health === "warn" ? "98.6%" : "99.7%";

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-white/50">Node</p>
        <h3 className="text-2xl font-semibold text-white">{node.label}</h3>
        <p className="text-sm text-white/60">Type · {node.kind.toUpperCase()}</p>
      </div>
      <div>
        <p className="section-title mb-3">Recent changes</p>
        <div className="space-y-2 text-sm">
          {relatedChanges.length === 0 && <p className="text-white/50">No change linked.</p>}
          {relatedChanges.map((change) => (
            <div key={change.id} className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <p className="font-semibold text-white">{change.id}</p>
              <p className="text-white/70">{change.notes}</p>
              <p className="text-xs text-white/50">
                {change.owner} · Risk {Math.round(change.riskScore * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm">
        <p className="text-white/60">Owner</p>
        <p className="text-white">
          {svc?.owner ?? (node.kind === "db" ? "Data Platform" : "Cloud Enablement")}
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm">
        <p className="text-white/60">SLO Target · {sloTarget}</p>
        <p className="text-lg font-semibold text-white">Current {sloActual}</p>
      </div>
      <div>
        <p className="section-title mb-3">Linked incidents</p>
        <div className="space-y-2 text-sm">
          {relatedIncidents.length === 0 && (
            <p className="text-white/50">No linked incidents.</p>
          )}
          {relatedIncidents.map((incident) => (
            <div key={incident.id} className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <p className="font-semibold text-white">{incident.id}</p>
              <p className="text-white/70">{incident.title}</p>
              <p className="text-xs text-white/50">
                Status · {incident.status} · Severity {incident.severity}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm">
        <p className="text-white/60">Quick actions</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
          <li>Open runbooks for {node.label}</li>
          <li>Launch chat with owner {svc?.owner ?? "Platform"}</li>
          <li>Attach topology snapshot to incident</li>
        </ul>
      </div>
    </Card>
  );
}
