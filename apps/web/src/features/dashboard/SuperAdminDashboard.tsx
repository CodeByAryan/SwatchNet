import React, { useEffect, useState } from "react";
import { Search, Inbox, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import {
  DashboardShell,
  SummaryCard,
  DashboardError,
  EmptyState,
  Spinner,
  Pagination,
  type DashboardNavItem,
} from "./DashboardShell";
import {
  safeApiCall,
  type ApiUser,
  type ApiActivity,
  type PlatformStats,
  type Paginated,
  type ApiApplication,
} from "../../lib/dashboardApi";
import { useSession } from "../../session/SessionProvider";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "../../session/roles";
import { formatDate } from "../../lib/dashboardApi";

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Overview", href: "/admin/super/overview", icon: React.createElement(OverviewIcon) },
  { label: "User management", href: "/admin/super/users", icon: React.createElement(UsersIcon) },
  { label: "Volunteer applications", href: "/admin/super/applications", icon: React.createElement(InboxIcon) },
  { label: "Global activity", href: "/admin/super/activity", icon: React.createElement(ShieldAlertIcon) },
  { label: "Platform settings", href: "/admin/super/settings", icon: React.createElement(SettingsIcon) },
];

function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="7" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><path d="M19 8v6" /><path d="M22 11h-6" />
    </svg>
  );
}
function InboxIcon() {
  return <Inbox className="h-4 w-4" />;
}
function ShieldAlertIcon() {
  return <ShieldAlert className="h-4 w-4" />;
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

/** Reusable role-select control used on the users page. */
function RoleSelect({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <label className="text-xs font-semibold text-[#202923]">
      Role
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as UserRole)}
        className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2 text-sm font-medium text-[#202923] shadow-xs"
      >
        {USER_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SuperAdminDashboard(): React.JSX.Element {
  const { user } = useSession();
  const activePath = window.location.pathname;
  const [activeSection] = useState<string>(
    NAV_ITEMS.find((item) => activePath.startsWith(item.href))?.href ?? "/admin/super/overview",
  );

  const title =
    activeSection === "/admin/super/users"
      ? "User management"
      : activeSection === "/admin/super/applications"
        ? "Volunteer applications"
        : activeSection === "/admin/super/activity"
          ? "Global activity"
          : activeSection === "/admin/super/settings"
            ? "Platform settings"
            : "Platform overview";

  const subtitle =
    activeSection === "/admin/super/users"
      ? "Search, review and change roles for every registered account."
      : activeSection === "/admin/super/applications"
        ? "Review pending volunteer applications."
        : activeSection === "/admin/super/activity"
          ? "Every platform action recorded in the audit log."
          : activeSection === "/admin/super/settings"
            ? "Service health and configuration."
            : "Platform-wide statistics and latest activity.";

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      nav={NAV_ITEMS}
      role={user?.role ?? "super_admin"}
    >
      {activeSection === "/admin/super/overview" && <OverviewSection />}
      {activeSection === "/admin/super/users" && <UsersSection />}
      {activeSection === "/admin/super/applications" && <ApplicationsSection />}
      {activeSection === "/admin/super/activity" && <ActivitySection />}
      {activeSection === "/admin/super/settings" && <SettingsSection />}
    </DashboardShell>
  );
}

function OverviewSection(): React.JSX.Element {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    stats: PlatformStats | null;
    activity: ApiActivity[];
  }>({ loading: true, error: null, stats: null, activity: [] });

  const load = React.useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const [statsResult, activityResult] = await Promise.all([
        safeApiCall<PlatformStats>("/admin/platform/stats"),
        safeApiCall<Paginated<ApiActivity>>("/admin/platform/activity?page=1&pageSize=8"),
      ]);
      if (!statsResult.ok) {
        setState({ loading: false, error: statsResult.error.message, stats: null, activity: [] });
        return;
      }
      setState({
        loading: false,
        error: null,
        stats: statsResult.data,
        activity: activityResult.ok ? activityResult.data.items : [],
      });
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.loading) return <Spinner label="Loading platform overview…" />;
  if (state.error || !state.stats) {
    return <DashboardError message={state.error ?? "Failed to load platform statistics."} onRetry={load} />;
  }

  const { users, reports, tasks, applications } = state.stats;
  const roleRows: Array<[UserRole, number]> = [
    ["user", users.byRole.user ?? 0],
    ["volunteer", users.byRole.volunteer ?? 0],
    ["admin", users.byRole.admin ?? 0],
    ["super_admin", users.byRole.super_admin ?? 0],
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">Accounts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Total users" value={users.total} hint={`${users.newLast7Days} joined last 7 days`} tone="green" />
          <SummaryCard label="Citizens" value={roleRows[0][1]} />
          <SummaryCard label="Volunteers" value={roleRows[1][1]} />
          <SummaryCard label="Admins" value={roleRows[2][1]} />
          <SummaryCard label="Super admins" value={roleRows[3][1]} tone="blue" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">Reports & cleanups</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Reports" value={reports.total} tone="amber" />
          <SummaryCard label="Pending review" value={reports.submitted} tone="amber" />
          <SummaryCard label="In progress" value={reports.inProgress} tone="blue" />
          <SummaryCard label="Resolved" value={reports.resolved} tone="green" />
          <SummaryCard label="Active tasks" value={tasks.assigned + tasks.inProgress} tone="blue" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Volunteer applications" value={applications.pending} hint="Waiting for a decision" tone="amber" />
        <SummaryCard label="Audit events today" value={state.stats.activityToday} tone="default" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#68756d]">Recent activity</h2>
          <a
            href="/admin/super/activity"
            onClick={(event) => {
              event.preventDefault();
              window.history.pushState({}, "", "/admin/super/activity");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="text-xs font-semibold text-[#248a61] hover:underline"
          >
            View all →
          </a>
        </div>
        <div className="rounded-xl border-[#e1e7e0] bg-white">
          {state.activity.length === 0 ? (
            <EmptyState title="No activity recorded yet" description="Actions on the platform will appear here." />
          ) : (
            <ul className="divide-y divide-[#e1e7e0]">
              {state.activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#202923]">
                      {item.actorName ?? "System"} · {item.action}
                    </p>
                    {item.detail && <p className="text-xs text-[#68756d]">{item.detail}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] text-[#94a199]">{formatDate(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function UsersSection(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiUser> | null;
  }>({ loading: true, error: null, data: null });
  const [editTarget, setEditTarget] = useState<ApiUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (query.trim()) params.set("search", query.trim());
      if (roleFilter) params.set("role", roleFilter);
      const outcome = await safeApiCall<Paginated<ApiUser>>(`/admin/users?${params.toString()}`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page, query, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openEditor = (target: ApiUser) => {
    setEditTarget(target);
    setEditRole(target.role);
    setActionError(null);
    setNotice(null);
  };

  const saveRole = async () => {
    if (!editTarget) return;
    setSaving(true);
    setActionError(null);
    const outcome = await safeApiCall<ApiUser>(`/admin/users/${editTarget.id}/role`, {
      method: "PUT",
      body: { role: editRole } as unknown as BodyInit,
    });
    setSaving(false);
    if (outcome.ok) {
      setNotice(`${outcome.data.name} is now ${ROLE_LABELS[outcome.data.role]}.`);
      setEditTarget(null);
      load();
    } else {
      setActionError(outcome.error.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold text-[#202923]">
          Search users
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a199]" />
            <input
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Name or email…"
              className="w-full rounded-lg border-[#e1e7e0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#202923] shadow-xs placeholder:text-[#94a199]"
            />
          </div>
        </label>
        <label className="text-xs font-semibold text-[#202923] sm:w-48">
          Role
          <select
            value={roleFilter}
            onChange={(event) => {
              setPage(1);
              setRoleFilter(event.target.value);
            }}
            className="mt-1 w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
          >
            <option value="">All roles</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-lg border-[#bde3cf] bg-[#e6f3eb] px-3 py-2 text-xs font-medium text-[#163d32]">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </p>
      )}
      {actionError && <DashboardError message={actionError} />}

      {result.loading ? (
        <Spinner label="Loading users…" />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border-[#e1e7e0] bg-white">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-[#e1e7e0] bg-[#f7f8f4]">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#68756d]">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Joined</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2ee]">
              {result.data.items.map((item) => (
                <tr key={item.id} className="hover:bg-[#f7f8f4]">
                  <td className="px-4 py-2.5 font-semibold text-[#202923]">{item.name}</td>
                  <td className="px-4 py-2.5 text-[#68756d]">{item.email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.role === "super_admin"
                          ? "border-[#bad4eb] bg-[#edf4fa] text-[#275b85]"
                          : item.role === "admin"
                            ? "border-[#bde3cf] bg-[#e6f3eb] text-[#163d32]"
                            : item.role === "volunteer"
                              ? "border-[#f4d399] bg-[#fdf5e8] text-[#946215]"
                              : "border-[#e1e7e0] bg-[#f7f8f4] text-[#68756d]"
                        }`}
                    >
                      {ROLE_LABELS[item.role]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#68756d]">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEditor(item)}
                      className="rounded-lg border-[#e1e7e0] bg-white px-2.5 py-1 font-semibold text-[#202923] hover:bg-[#f7f8f4]"
                    >
                      Change role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No users found" description="Try a different search term or role filter." />
      )}

      {result.data && <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="font-display text-lg font-bold text-[#202923]">Change role</h2>
            <p className="mt-1 text-xs text-[#68756d]">
              {editTarget.name} · {editTarget.email}
            </p>
            <div className="mt-4">
              <RoleSelect value={editRole} onChange={setEditRole} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#68756d]">
              Only Super Admins can assign privileged roles. The last Super Admin cannot be demoted.
            </p>
            {actionError && <p className="mt-2 text-xs font-semibold text-[#c94c4c]">{actionError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="inline-flex min-h-10 items-center rounded-lg border-[#e1e7e0] bg-white px-4 py-2 text-sm font-semibold text-[#202923] hover:bg-[#f7f8f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveRole()}
                disabled={saving}
                className="inline-flex min-h-10 items-center rounded-lg bg-[#248a61] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationsSection(): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiApplication> | null;
  }>({ loading: true, error: null, data: null });
  const [actionError, setActionError] = useState<string | null>(null);

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const outcome = await safeApiCall<Paginated<ApiApplication>>(`/admin/volunteer-applications?${params.toString()}`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, decision: "approved" | "rejected") => {
    setActionError(null);
    const outcome = await safeApiCall<ApiApplication>(`/admin/volunteer-applications/${id}/review`, {
      method: "POST",
      body: { decision } as unknown as BodyInit,
    });
    if (outcome.ok) load();
    else setActionError(outcome.error.message);
  };

  return (
    <div className="space-y-5">
      <label className="block w-full text-xs font-semibold text-[#202923] sm:w-56">
        Status
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="mt-1 w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </label>

      {actionError && <DashboardError message={actionError} />}

      {result.loading ? (
        <Spinner label="Loading applications…" />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="space-y-3">
          {result.data.items.map((application) => (
            <div key={application.id} className="rounded-xl border-[#e1e7e0] bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-[#202923]">{application.applicant.name}</div>
                <span className="text-[11px] text-[#94a199]">{formatDate(application.createdAt)}</span>
              </div>
              <p className="text-xs text-[#68756d]">{application.applicant.email}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#202923]">{application.motivation}</p>
              {application.status === "pending" && (
                <div className="mt-3 flex gap-2 border-t border-[#e1e7e0] pt-3">
                  <button
                    type="button"
                    onClick={() => void review(application.id, "approved")}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#248a61] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e7452]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve as volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => void review(application.id, "rejected")}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border-[#f3b6b6] bg-white px-3 py-1.5 text-xs font-semibold text-[#c94c4c] hover:bg-[#fcf0f0]"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No applications here"
          description={
            statusFilter === "pending"
              ? "No pending volunteer applications. New ones will appear here."
              : "No applications match this filter."
          }
        />
      )}

      {result.data && <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />}
    </div>
  );
}

function ActivitySection(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiActivity> | null;
  }>({ loading: true, error: null, data: null });

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const outcome = await safeApiCall<Paginated<ApiActivity>>(`/admin/platform/activity?page=${page}&pageSize=20`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (result.loading) return <Spinner label="Loading activity…" />;
  if (result.error) return <DashboardError message={result.error} onRetry={load} />;
  if (!result.data || result.data.items.length === 0) {
    return <EmptyState title="No activity recorded yet" description="Platform actions will appear here as they happen." />;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-[#e1e7e0] bg-white">
        <ul className="divide-y divide-[#f0f2ee]">
          {result.data.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#202923]">
                  {item.actorName ?? "System"} · {item.action}
                </p>
                {item.detail && <p className="truncate text-xs text-[#68756d]">{item.detail}</p>}
              </div>
              <span className="shrink-0 text-[11px] text-[#94a199]">{formatDate(item.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>
      <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
    </div>
  );
}

function SettingsSection(): React.JSX.Element {
  const [health, setHealth] = useState<{ loading: boolean; error: string | null; ok: boolean | null }>({
    loading: true,
    error: null,
    ok: null,
  });

  useEffect(() => {
    void (async () => {
      const outcome = await safeApiCall<{ status?: string; data?: { status: string } }>("health");
      const isReachable = outcome.ok && (outcome.data?.status === "ok" || outcome.data?.data?.status === "ok");
      setHealth({ loading: false, error: outcome.ok ? null : outcome.error.message, ok: isReachable });
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-[#e1e7e0] bg-white p-4">
        <h2 className="font-display text-sm font-bold text-[#202923]">Backend service</h2>
        {health.loading ? (
          <p className="mt-1 text-xs text-[#68756d]">Checking…</p>
        ) : health.ok ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#248a61]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Reachable
          </p>
        ) : (
          <p className="mt-1 text-xs font-semibold text-[#c94c4c]">{health.error}</p>
        )}
      </div>
      <div className="rounded-xl border-[#e1e7e0] bg-white p-4">
        <h2 className="font-display text-sm font-bold text-[#202923]">Bootstrap</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#68756d]">
          The first Super Admin is bootstrapped with a one-time server token. See the README for the
          controlled procedure — it never happens automatically.
        </p>
      </div>
    </div>
  );
}
