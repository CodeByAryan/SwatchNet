import React from "react";
import { Navigate } from "react-router-dom";
import { useSession, dashboardPathForRole } from "../session/SessionProvider";
import type { UserRole } from "../session/roles";
import { hasRoleAtLeast, ROLE_LABELS } from "../session/roles";

/** Shown while the session profile is being resolved from the backend. */
export function SessionSplash({ label = "Checking your session…" }: { label?: string }): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-[#e1e7e0] border-t-[#248a61]"
        role="status"
        aria-label={label}
      />
      <p className="text-sm font-medium text-[#68756d]">{label}</p>
    </div>
  );
}

export function AccessDenied({ requiredRole }: { requiredRole?: UserRole }): React.JSX.Element {
  const { user, signOut } = useSession();
  return (
    <div className="section-wrap flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fcf0f0] text-[#c94c4c]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold text-[#202923]">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-[#68756d]">
        {requiredRole
          ? `This workspace is limited to ${ROLE_LABELS[requiredRole]} accounts.`
          : "You do not have permission to view this page."}{" "}
        You are signed in as {user ? ROLE_LABELS[user.role] : "a guest"}.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {user && (
          <a
            href={dashboardPathForRole(user.role)}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452]"
          >
            Go to my dashboard
          </a>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-[#e1e7e0] bg-white px-4 py-2.5 text-sm font-semibold text-[#202923] hover:bg-[#f7f8f4]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  /** Minimum role required. Omit for "any signed-in user". */
  minimumRole?: UserRole;
  /** Exact role required (Super Admin pages use this). */
  exactRole?: UserRole;
  children: React.ReactNode;
}

/**
 * Client-side convenience guard. The backend re-checks every role on each API
 * call; this only keeps users out of dashboards they cannot use.
 */
export function ProtectedRoute({ minimumRole, exactRole, children }: ProtectedRouteProps): React.JSX.Element {
  const { user, loading } = useSession();

  if (loading || user === undefined) {
    return <SessionSplash />;
  }

  if (user === null) {
    const target = `${window.location.pathname}${window.location.search}`;
    return <Navigate to="/auth/signin" state={{ from: target }} replace />;
  }

  if (exactRole && user.role !== exactRole) {
    return <AccessDenied requiredRole={exactRole} />;
  }

  if (minimumRole && !hasRoleAtLeast(user.role, minimumRole)) {
    return <AccessDenied requiredRole={minimumRole} />;
  }

  return <>{children}</>;
}

/** Signed-in users should never see the sign-in/up pages again. */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, loading } = useSession();

  if (loading || user === undefined) {
    return <SessionSplash />;
  }
  if (user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <>{children}</>;
}

export function NotFoundPage(): React.JSX.Element {
  const { user } = useSession();
  return (
    <div className="section-wrap flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
      <h1 className="font-display text-3xl font-bold text-[#202923]">Page not found</h1>
      <p className="mt-2 text-sm text-[#68756d]">The page you requested does not exist.</p>
      <a
        href={user ? dashboardPathForRole(user.role) : "/"}
        className="mt-6 inline-flex min-h-[2.5rem] items-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452]"
      >
        {user ? "Back to my dashboard" : "Back to home"}
      </a>
    </div>
  );
}
