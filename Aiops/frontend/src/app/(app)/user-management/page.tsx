'use client';

import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMemo, useState } from "react";

type UserStatus = "Active" | "Inactive";
type UserRole = "Admin" | "Operator" | "Observer";

type User = {
  name: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
};

const users: User[] = [
  { name: "John Doe", role: "Admin", status: "Active", lastLogin: "2 hours ago" },
  { name: "Jane Smith", role: "Operator", status: "Active", lastLogin: "5 days ago" },
  { name: "Alice Johnson", role: "Observer", status: "Inactive", lastLogin: "1 month ago" },
  { name: "Bob Brown", role: "Operator", status: "Active", lastLogin: "Just now" },
];

const statusVariant: Record<UserStatus, "success" | "outline"> = {
  Active: "success",
  Inactive: "outline",
};

const roleOptions: UserRole[] = ["Admin", "Operator", "Observer"];
const statusOptions: UserStatus[] = ["Active", "Inactive"];
const roleFilterOptions = ["All", ...roleOptions];

export default function UserManagementPage() {
  const [currentUsers, setCurrentUsers] = useState<User[]>(users);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Observer" as UserRole,
    status: "Active" as UserStatus,
  });

  const activeUsers = useMemo(
    () => currentUsers.filter((user) => user.status === "Active"),
    [currentUsers],
  );

  const resetForm = () => {
    setForm({ name: "", email: "", role: "Observer", status: "Active" });
  };

  const handleCreateUser = () => {
    if (!form.name || !form.email) {
      return;
    }
    setCurrentUsers((prev) => [
      ...prev,
      {
        name: form.name,
        role: form.role,
        status: form.status,
        lastLogin: "Never",
      },
    ]);
    setShowNewUserModal(false);
    resetForm();
  };

  return (
    <AuthGate>
      <RequireRole roles={["admin"]}>
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-title">User Management</p>
                <p className="text-sm text-white/60">All Users</p>
              </div>
              <div className="flex gap-3">
                {["All Users", "Add User", "Audit Logs"].map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-full px-4 py-1 text-sm font-semibold ${
                      tab === "All Users" ? "bg-[var(--card)] text-[var(--text)]" : "text-white/60"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                {roleFilterOptions.map((role) => (
                  <option key={role} value={role.toLowerCase()}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                type="search"
                placeholder="Search..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[var(--accent)]"
              />
              <Button variant="default" className="text-sm px-4 py-2" onClick={() => setShowNewUserModal(true)}>
                New User
              </Button>
            </div>
          </div>

          <Card className="rounded-none border border-white/10 bg-white/5 p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.name} className="border-t border-white/10 transition hover:bg-white/5">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{user.name}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/60">{user.role}</td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariant[user.status] ?? "default"} className="rounded-full px-3">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/60">{user.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-white/50">
            Showing {activeUsers.length} active {activeUsers.length === 1 ? "user" : "users"}.
          </p>
          {showNewUserModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur"
                onClick={() => setShowNewUserModal(false)}
              />
              <div className="relative z-50 w-full max-w-lg space-y-6 rounded-[32px] border border-white/10 bg-[var(--surface)] p-8 shadow-[0_30px_60px_rgba(3,7,18,0.45)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Add user</p>
                    <h3 className="text-2xl font-semibold text-[var(--text)]">Invite a teammate</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewUserModal(false)}
                    className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Provide full user details and assign a role so they can access the AIOps Control Plane.
                </p>
                <div className="grid gap-4">
                  <label className="text-xs uppercase tracking-widest text-[var(--muted)]">
                    Full name
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="e.g. Samantha Patel"
                      className="mt-2 w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent)]"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-widest text-[var(--muted)]">
                    Email address
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="samantha.p@royalcyber.ai"
                      className="mt-2 w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent)]"
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)]">
                      Role
                      <select
                        className="mt-2 w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[var(--accent)]"
                        value={form.role}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            role: event.target.value as UserRole,
                          }))
                        }
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)]">
                      Status
                      <select
                        className="mt-2 w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[var(--accent)]"
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status: event.target.value as UserStatus,
                          }))
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" size="sm" className="px-5 py-2" onClick={() => setShowNewUserModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" className="px-6 py-2" onClick={handleCreateUser}>
                    Create user
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </RequireRole>
    </AuthGate>
  );
}
