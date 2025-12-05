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
      <aside className="group/side sticky top-0 hidden h-screen w-16 flex-shrink-0 overflow-y-auto no-scrollbar border-r border-slate-800 bg-slate-900 px-2 py-6 text-slate-100 transition-[width,padding] duration-300 hover:w-64 hover:px-4 lg:flex lg:flex-col">
        <nav className="mt-4 flex-1 space-y-6 text-sm">
          {filteredNav.map((group) => (
            <div key={group.label}>
              <p className="hidden text-xs uppercase tracking-wide text-slate-300 font-semibold group-hover/side:block">
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
                        "flex items-center justify-center gap-0 rounded-md px-2 py-2 text-slate-100 transition hover:bg-slate-800 hover:text-slate-100 group-hover/side:justify-start group-hover/side:gap-3 group-hover/side:px-3",
                        isActive && "bg-rose-600 text-white shadow-[0_10px_25px_rgba(244,63,94,0.35)] hover:bg-rose-700"
                      )}
                    >
                      <Icon className="h-4 w-4 text-slate-100" />
                      <span className="ml-0 hidden truncate text-slate-100 group-hover/side:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 hidden space-y-1 text-sm text-slate-100 group-hover/side:block">
          <p className="px-3 text-xs uppercase tracking-wide text-slate-300 font-semibold">Support</p>
          <Link
            to="/account"
            className="flex items-center justify-start gap-3 rounded-md px-3 py-2 text-slate-100 transition hover:bg-slate-800"
          >
            <User className="h-4 w-4 text-slate-100" />
            <span className="ml-0 truncate text-slate-100">Profile</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center justify-start gap-3 rounded-md px-3 py-2 text-slate-100 transition hover:bg-slate-800"
          >
            <Settings className="h-4 w-4 text-slate-100" />
            <span className="ml-0 truncate text-slate-100">Settings</span>
          </Link>
          <button
            type="button"
            className="flex w-full items-center justify-start gap-3 rounded-md px-3 py-2 text-left text-red-300 transition hover:bg-red-500 hover:text-white"
            onClick={requestSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-0 truncate">Sign Out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-[var(--surface)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-10">
        <header className="relative mb-4 flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-slate-100 px-5 py-3 text-[var(--text)] shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" aria-label="Royal Cyber home" className="block">
              <BrandMark />
            </Link>
            <p className="hidden text-sm text-[var(--text)] sm:block">Royal Cyber AIOps for Enterprise</p>
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
              <Button variant="muted" className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--card-muted)]">
                <UserCircle2 className="h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="flex items-center gap-2 rounded-full px-5 py-2 text-sm shadow-[0_6px_14px_rgba(244,63,94,0.25)]"
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
