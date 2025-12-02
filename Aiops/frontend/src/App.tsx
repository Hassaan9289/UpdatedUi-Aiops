import { Helmet } from "react-helmet-async";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import LoginPage from "@/app/login/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import EnterpriseSystemsPage from "@/app/(app)/enterprise-systems/page";
import HybridsPage from "@/app/(app)/hybrids/page";
import CloudsPage from "@/app/(app)/clouds/page";
import AgentManagementPage from "@/app/(app)/agent-management/page";
import McpPage from "@/app/(app)/mcp/page";
import ChatOpsPage from "@/app/(app)/chatops/page";
import LlmManagementPage from "@/app/(app)/llm-management/page";
import IntegrationsPage from "@/app/(app)/integrations/page";
import AIOpsConnectorPage from "@/app/(app)/aiops-connector/page";
import FlowBuilderPage from "@/app/(app)/flow-builder/page";
import UserManagementPage from "@/app/(app)/user-management/page";
import LegacyAIOpsConnectorPage from "@/app/(app)/aiopsConnector/page";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth/AuthGate";

function ShellLayout() {
  return (
    <AuthGate>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthGate>
  );
}

function AccountPlaceholder() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-white/70">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Profile</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--text)]">Account settings</p>
      <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
        This placeholder keeps the navigation experience consistent after the migration. Replace with your
        actual profile screen whenever it is ready.
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <Card className="space-y-3">
      <p className="text-xl font-semibold text-[var(--text)]">Page not found</p>
      <p className="text-sm text-[var(--muted)]">The route you requested is not available.</p>
    </Card>
  );
}

function ProtectedNotFound() {
  return (
    <AuthGate>
      <NotFound />
    </AuthGate>
  );
}

export default function App() {
  return (
    <>
      <Helmet>
        <title>AIOps Control Plane</title>
        <meta
          name="description"
          content="Monitor, analyze, automate, and optimize incidents inspired by IBM Cloud Pak for AIOps."
        />
      </Helmet>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ShellLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/enterprise-systems" element={<EnterpriseSystemsPage />} />
          <Route path="/hybrids" element={<HybridsPage />} />
          <Route path="/clouds" element={<CloudsPage />} />
          <Route path="/agent-management" element={<AgentManagementPage />} />
          <Route path="/mcp" element={<McpPage />} />
          <Route path="/chatops" element={<ChatOpsPage />} />
          <Route path="/llm-management" element={<LlmManagementPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/aiops-connector" element={<AIOpsConnectorPage />} />
          <Route path="/aiopsConnector" element={<LegacyAIOpsConnectorPage />} />
          <Route path="/flow-builder" element={<FlowBuilderPage />} />
          <Route path="/user-management" element={<UserManagementPage />} />
          <Route path="/account" element={<AccountPlaceholder />} />
          <Route path="*" element={<ProtectedNotFound />} />
        </Route>
      </Routes>
    </>
  );
}
