'use client';

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Cloud,
  CloudSun,
  Bot,
  LayoutDashboard,
  Layers,
  LogOut,
  LucideIcon,
  MessageCircle,
  PlugZap,
  Server,
  ServerCog,
  Share2,
  Settings,
  User,
  UserCircle2,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/auth/session";
import { Role } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

const nav: { label: string; items: NavItem[] }[] = [
  {
    label: "Core",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "operator", "executive", "observer"],
      },
      {
        label: "Enterprise systems",
        href: "/enterprise-systems",
        icon: Server,
        roles: ["admin", "operator", "executive", "observer"],
      },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Hybrids", href: "/hybrids", icon: CloudSun, roles: ["admin", "operator", "executive"] },
      { label: "Clouds", href: "/clouds", icon: Cloud, roles: ["admin", "operator", "executive"] },
      { label: "Agent management", href: "/agent-management", icon: UserCog, roles: ["admin", "operator"] },
      { label: "MCP Servers", href: "/mcp", icon: ServerCog, roles: ["admin", "operator"] },
      { label: "ChatOps", href: "/chatops", icon: MessageCircle, roles: ["admin", "operator"] },
      { label: "LLM management", href: "/llm-management", icon: Bot, roles: ["admin", "operator"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Connectors", href: "/integrations", icon: PlugZap, roles: ["admin", "operator"] },
      { label: "AIOps connector", href: "/aiops-connector", icon: Share2, roles: ["admin", "operator"] },
      { label: "User management", href: "/user-management", icon: UserCircle2, roles: ["admin"] },
    ],
  },
  {
    label: "Flow",
    items: [
      {
        label: "Flow Builder",
        href: "/flow-builder",
        icon: Layers,
        roles: ["admin", "operator", "executive", "observer"],
      },
    ],
  },
];

const breadcrumbsLabel: Record<string, string> = Object.fromEntries(
  nav.flatMap((group) => group.items.map((item) => [item.href, item.label])),
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname || "/";
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const logout = useSessionStore((state) => state.logout);
  const role = user?.role;
  const activeLabel = breadcrumbsLabel[pathname] ?? "Overview";
  const [isSignOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const filteredNav = nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !role || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  const handleSignOut = () => {
    setSignOutConfirmOpen(false);
    logout();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const requestSignOut = () => {
    setSignOutConfirmOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--text)]">
      <aside className="group/side sticky top-0 hidden h-screen w-16 flex-shrink-0 overflow-y-auto no-scrollbar border-r border-[var(--border)] bg-[var(--surface)] px-2 py-6 transition-[width,padding] duration-300 hover:w-64 hover:px-6 lg:flex lg:flex-col">
        <nav className="mt-8 flex-1 space-y-6 text-sm">
          {filteredNav.map((group) => (
            <div key={group.label}>
              <p className="hidden text-xs uppercase tracking-wide text-[var(--muted)] group-hover/side:block">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center justify-center gap-0 rounded-none px-2 py-2 text-[var(--muted)] transition group-hover/side:justify-start group-hover/side:gap-2 group-hover/side:px-3 hover:bg-slate-200/60",
                        isActive && "bg-[var(--card-muted)] text-[var(--text)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="ml-0 hidden truncate group-hover/side:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="hidden rounded-none border border-[var(--border)] bg-[var(--card-muted)] p-4 text-xs text-[var(--muted)] group-hover/side:block">
          <p className="font-semibold text-[var(--text)]">Proactive posture</p>
          <p className="mt-1">AI Agents watching 214 services continuously.</p>
          <Button variant="muted" className="mt-3 w-full">
            View runbooks
          </Button>
        </div>
        <div className="mt-6 space-y-1 text-sm">
          <p className="hidden px-3 text-xs uppercase tracking-wide text-[var(--muted)] group-hover/side:block">Support</p>
          <Link
            to="/account"
            className="flex items-center justify-center gap-0 rounded-none px-2 py-2 text-[var(--muted)] transition group-hover/side:justify-start group-hover/side:gap-2 group-hover/side:px-3 hover:bg-slate-200/60"
          >
            <User className="h-4 w-4" />
            <span className="ml-0 hidden truncate group-hover/side:inline">Profile</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center justify-center gap-0 rounded-none px-2 py-2 text-[var(--muted)] transition group-hover/side:justify-start group-hover/side:gap-2 group-hover/side:px-3 hover:bg-slate-200/60"
          >
            <Settings className="h-4 w-4" />
            <span className="ml-0 hidden truncate group-hover/side:inline">Settings</span>
          </Link>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-0 rounded-none px-2 py-2 text-left text-[var(--muted)] transition group-hover/side:justify-start group-hover/side:gap-2 group-hover/side:px-3 hover:bg-slate-200/60"
            onClick={requestSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-0 hidden truncate group-hover/side:inline">Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-[var(--surface)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-10">
        <header className="relative flex items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" aria-label="Royal Cyber home" className="block">
              <BrandMark />
            </Link>
            <p className="hidden text-xs text-[var(--muted)] sm:block">Royal Cyber AIOps for Enterprise</p>
          </div>

          <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-semibold text-[var(--text)]">
            {activeLabel}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <div className="text-right text-sm">
              <Link to="/account" className="font-semibold text-[var(--text)] transition hover:text-[var(--accent)]">
                {user?.email ?? "Unknown user"}
              </Link>
              {role && (
                <div className="mt-1 flex justify-end">
                  <Badge className="capitalize">
                    {role}
                  </Badge>
                </div>
              )}
            </div>
            <Link to="/account">
              <Button variant="muted" className="flex items-center gap-2 px-4 py-2 text-sm rounded-full">
                <UserCircle2 className="h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="px-4 py-2 text-sm rounded-full flex items-center gap-2"
              style={{
                backgroundImage: "none",
                backgroundColor: "#dc2626",
                boxShadow: "0 8px 20px rgba(220, 38, 38, 0.35)",
              }}
              onClick={requestSignOut}
            >
              Sign out
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="mt-6">{children}</div>
      </main>
      {isSignOutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/30 bg-white/95 p-6 shadow-[0_25px_45px_rgba(15,23,42,0.35)]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Confirm sign out</p>
              <h3 className="text-2xl font-semibold text-slate-900">Are you sure you want to sign out?</h3>
              <p className="text-sm text-slate-600">You will be redirected back to the login screen.</p>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setSignOutConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
