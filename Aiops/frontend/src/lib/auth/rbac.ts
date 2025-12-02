export type Role = "admin" | "operator" | "executive" | "observer";

export type Permission =
  | "view:*"
  | "run:automation"
  | "approve:automation"
  | "post:chatops"
  | "export:analytics"
  | "admin:all";

export const rolePermissions: Record<Role, Permission[]> = {
  admin: ["view:*", "run:automation", "approve:automation", "post:chatops", "export:analytics", "admin:all"],
  operator: ["view:*", "run:automation", "approve:automation", "post:chatops"],
  executive: ["view:*", "export:analytics"],
  observer: ["view:*"],
};

type MaybeUser = { role?: Role | null } | null | undefined;

const hasAdminAll = (role?: Role | null) =>
  role ? rolePermissions[role].includes("admin:all") : false;

export function hasRole(user: MaybeUser, role: Role) {
  return !!user?.role && user.role === role;
}

export function can(user: MaybeUser, permission: Permission) {
  if (!user?.role) return false;
  if (hasAdminAll(user.role)) return true;
  return rolePermissions[user.role]?.includes(permission) ?? false;
}
