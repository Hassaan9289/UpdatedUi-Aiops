# AIOps UI RBAC Overview

This project uses **client-side authentication only**. There is no backend, middleware, or secure session storage. Everything runs in the browser with mock users, so do not treat it as production security.

## How it works

- **Mock users** live in `src/lib/auth/mockUsers.ts`. All demo accounts use the password `Passw0rd!` (for demo only).
- **Roles & permissions** are defined in `src/lib/auth/rbac.ts`. Update `rolePermissions` to add/remove capabilities and extend the `Permission` union for new checks.
- **Session store** (`src/lib/auth/session.ts`) is a Zustand store persisted to `localStorage`. It tracks the active user, exposes helpers like `isAuthenticated`, `role`, and `can(permission)`, and hydrates automatically on load.
- **Guards** live in `src/components/auth/`:
  - `AuthGate` redirects unauthenticated visitors to `/login`.
  - `RequireRole` renders children only when the current role is in an allowed list.
  - `Can` conditionally renders UI based on a permission string, letting you swap in disabled states for unauthorized actions.
  - `Denied` provides the standard “access denied” empty state.
- **Pages** under `src/app/(app)/` are all client components wrapped with `<AuthGate>` and `<RequireRole ...>`. This ensures every route behind the application shell is session-aware.
- **Action-level RBAC** uses the `<Can>` helper. For example, the Automation run button and approval buttons only render as active for roles with `run:automation` or `approve:automation` respectively. The ChatOps composer and Analytics export buttons follow the same pattern.
- **Navigation** visibility is driven by the user role inside `AppShell`. Items that the role cannot access are hidden, but guards still protect deep links.

## Extending roles or permissions

1. Add the new role or permission to `src/lib/auth/rbac.ts`.
2. If you need demo credentials, add a user entry in `src/lib/auth/mockUsers.ts`.
3. Update `rolePermissions` to map the role to its permissions.
4. Ensure any UI that should be accessible uses `<RequireRole roles={[...]}>` with the new role and wrap sensitive actions in `<Can permission="...">`.
5. Update navigation/CTA logic in `AppShell` if the role should see different sections.

Because this is UI-only auth, adding a new permission is just a matter of creating a new string constant and checking it via the `Can` component.

## Limitations

- Sessions live only in the browser (`localStorage`), so clearing storage or using another browser logs the user out.
- Passwords are plain text, and credentials are embedded in the bundle. This is intentionally insecure for demo purposes.
- There is no server verification, CSRF protection, refresh tokens, or API gating—everything relies on client-side logic.

Use this setup to demo flows, not to secure a real environment.
