'use client';

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockUsers, MockUser } from "./mockUsers";
import { can as canAccess, Role, Permission } from "./rbac";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastLogin?: string;
}

interface SessionState {
  user: SessionUser | null;
  hydrated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
  role: () => Role | null;
  can: (permission: Permission) => boolean;
  setHydrated: (value: boolean) => void;
}

const sanitizeUser = (user: MockUser): SessionUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  lastLogin: new Date().toISOString(),
});

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      async login(email, password) {
        const normalized = email.trim().toLowerCase();
        const match = mockUsers.find(
          (u) => u.email.toLowerCase() === normalized && u.password === password,
        );
        if (!match) {
          return { success: false, message: "Invalid credentials" };
        }
        set({ user: sanitizeUser(match) });
        return { success: true };
      },
      logout() {
        set({ user: null });
      },
      isAuthenticated() {
        return !!get().user;
      },
      role() {
        return get().user?.role ?? null;
      },
      can(permission) {
        return canAccess(get().user, permission);
      },
      setHydrated(value) {
        set({ hydrated: value });
      },
    }),
    {
      name: "aiops-session",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHydrated(true);
        }
      },
    },
  ),
);
