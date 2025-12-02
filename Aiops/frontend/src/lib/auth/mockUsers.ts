import { Role } from "./rbac";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
}

/**
 * Demo-only user directory. Credentials are intentionally simple and must
 * never be used outside of local prototypes.
 */
export const mockUsers: MockUser[] = [
  {
    id: "u-admin",
    name: "Alice Admin",
    email: "alice.admin@demo.ai",
    role: "admin",
    password: "Passw0rd!", // demo only, not secure
  },
  {
    id: "u-ops",
    name: "Oliver Ops",
    email: "oliver.ops@demo.ai",
    role: "operator",
    password: "Passw0rd!", // demo only, not secure
  },
  {
    id: "u-exec",
    name: "Eva Exec",
    email: "eva.exec@demo.ai",
    role: "executive",
    password: "Passw0rd!", // demo only, not secure
  },
  {
    id: "u-obs",
    name: "Oscar Observer",
    email: "oscar.obs@demo.ai",
    role: "observer",
    password: "Passw0rd!", // demo only, not secure
  },
];
