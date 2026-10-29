import React, { useEffect, useState } from "react";
import { Search, CheckCircle2, XCircle, Inbox, ShieldAlert, Settings, Users, ClipboardList } from "lucide-react";
import {
  DashboardShell,
  SummaryCard,
  DashboardError,
  EmptyState,
  Spinner,
  Pagination,
  type DashboardNavItem,
} from "./DashboardShell";
import { ReportCard, TaskCard, ReportStatusChip } from "./shared";
import {
  safeApiCall,
  type ApiReport,
  type ApiTask,
  type ApiUser,
  type ApiActivity,
  type OperationsStats,
  type Paginated,
  type ApiApplication,
} from "../../lib/dashboardApi";
import { useSession } from "../../session/SessionProvider";
import { ROLE_LABELS } from "../../session/roles";

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Overview", href: "/admin/overview", icon: React.createElement(OverviewGlyph) },
  { label: "Reports", href: "/admin/reports", icon: React.createElement(ClipboardIcon) },
  { label: "Verification queue", href: "/admin/verify", icon: React.createElement(ShieldGlyph) },
  { label: "Volunteer applications", href: "/admin/applications", icon: React.createElement(InboxIcon) },
  { label: "Tasks", href: "/admin/tasks", icon: React.createElement(UsersGlyph) },
  { label: "Settings", href: "/admin/settings", icon: React.createElement(SettingsGlyph) },
];

function OverviewGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
    </svg>
  );
}
function ClipboardIcon() {
  return <ClipboardList className="h-4 w-4" />;
}
function ShieldGlyph() {
  return <ShieldAlert className="h-4 w-4" />;
}
function UsersGlyph() {
  return <Users className="h-4 w-4" />;
}
function SettingsGlyph() {
  return <Settings className="h-4 w-4" />;
}
function InboxIcon() {
  return <Inbox className="h-4 w-4" />;
}

export function AdminDashboard(): React.JSX.Element {
  const { user } = useSession();
  const [activeSection, setActiveSection] = useState(() => {
    const current = window.location.pathname;
    return NAV_ITEMS.find((item) => current.startsWith(item.href))?.href ?? "/admin/overview";
  });

  useEffect(() => {
    const onPop = () => {
      const current = window.location.pathname;
      setActiveSection(NAV_ITEMS.find((item) => current.startsWith(item.href))?.href ?? "/admin/overview");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const titles: Record<string, [string, string]> = {
    "/admin/overview": ["Operations overview", "Incoming reports, cleanups and volunteer coverage."],
    "/admin/reports": ["Reports", "Every garbage report with search and status filters."],
    "/admin/verify": ["Verification queue", "Submitted reports waiting for review."],
    "/admin/applications": ["Volunteer applications", "Applications from citizens who want to help."],
    "/admin/tasks": ["Cleanup tasks", "Assignments to volunteers and their progress."],
    "/admin/settings": ["Settings", "Service health and operational notes."],
  };

  const [title, subtitle] = titles[activeSection] ?? titles["/admin/overview"];

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      nav={NAV_ITEMS}
      role={user?.role ?? "admin"}
    >
      {activeSection === "/admin/overview" && <OverviewSection onNavigate={setActiveSection} />}
      {activeSection === "/admin/reports" && <ReportsSection />}
      {activeSection === "/admin/verify" && <VerificationQueueSection onNavigate={setActiveSection} />}
      {activeSection === "/admin/applications" && <ApplicationsSection />}
      {activeSection === "/admin/tasks" && <TasksSection />}
      {activeSection === "/admin/settings" && <SettingsSection />}
    </DashboardShell>
  );
}

function OverviewSection({ onNavigate }: { onNavigate: (href: string) => void }): React.JSX.Element {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    stats: OperationsStats | null;
    activity: ApiActivity[];
  }>({ loading: true, error: null, stats: null, activity: [] });

  const load = React.useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const [statsResult, activityResult] = await Promise.all([
        safeApiCall<OperationsStats>("/admin/operations/stats"),
        safeApiCall<Paginated<ApiActivity>>("/admin/operations/activity?page=1&pageSize=8"),
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

  if (state.loading) return <Spinner label="Loading operations…" />;
  if (state.error || !state.stats) {
    return <DashboardError message={state.error ?? "Failed to load operations."} onRetry={load} />;
  }

  const { reports, tasks, pendingApplications, activeVolunteers } = state.stats;
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">Report pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Total reports" value={reports.total} />
          <SummaryCard label="Pending review" value={reports.submitted} tone="amber" />
          <SummaryCard label="In progress" value={reports.in_progress} tone="blue" />
          <SummaryCard label="Resolved" value={reports.resolved} tone="green" />
          <SummaryCard label="Rejected" value={reports.rejected} tone="red" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">Cleanup tasks</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Assigned" value={tasks.assigned} tone="amber" />
          <SummaryCard label="In progress" value={tasks.in_progress} tone="blue" />
          <SummaryCard label="Completed" value={tasks.completed} tone="green" />
          <SummaryCard label="Cancelled" value={tasks.cancelled} />
          <SummaryCard label="Active volunteers" value={activeVolunteers} tone="green" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onNavigate("/admin/verify");
            window.history.pushState({}, "", "/admin/verify");
            window.scrollTo({ top: 0 });
          }}
          className="rounded-xl border-[#f4d399] bg-[#fdf5e8] p-5 text-left transition-colors hover:bg-[#fbeed6]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#946215]">Verification queue</span>
            <span className="rounded-full bg-[#946215] px-2.5 py-1 text-xs font-bold text-white">{reports.submitted}</span>
          </div>
          <p className="mt-1 text-xs text-[#946215]">Review submitted reports and assign volunteers.</p>
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate("/admin/applications");
            window.history.pushState({}, "", "/admin/applications");
            window.scrollTo({ top: 0 });
          }}
          className="rounded-xl border-[#bad4eb] bg-[#edf4fa] p-5 text-left transition-colors hover:bg-[#e1eef8]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#275b85]">Volunteer applications</span>
            <span className="rounded-full bg-[#275b85] px-2.5 py-1 text-xs font-bold text-white">{pendingApplications}</span>
          </div>
          <p className="mt-1 text-xs text-[#275b85]">Review citizens who want to join as volunteers.</p>
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">Recent activity</h2>
        <div className="rounded-xl border-[#e1e7e0] bg-white">
          {state.activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Actions will appear here as they happen." />
          ) : (
            <ul className="divide-y divide-[#e1e7e0]">
              {state.activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <p className="text-xs font-semibold text-[#202923]">{item.action}</p>
                  <p className="text-[11px] text-[#94a199]">{new Date(item.createdAt).toLocaleTimeString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportsSection(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiReport> | null;
  }>({ loading: true, error: null, data: null });
  const [detail, setDetail] = useState<ApiReport | null>(null);
  const [volunteers, setVolunteers] = useState<ApiUser[]>([]);
  const [assignVolunteerId, setAssignVolunteerId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (query.trim()) params.set("search", query.trim());
      if (statusFilter) params.set("status", statusFilter);
      const outcome = await safeApiCall<Paginated<ApiReport>>(`/reports?${params.toString()}`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page, query, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (report: ApiReport) => {
    setDetail(report);
    setAssignError(null);
    setStatusError(null);
    if (volunteers.length === 0) {
      const list = await safeApiCall<{ items: ApiUser[] }>("/users/volunteers");
      if (list.ok) setVolunteers(list.data.items);
    }
  };

  const assign = async () => {
    if (!detail || !assignVolunteerId) return;
    setAssigning(true);
    setAssignError(null);
    const outcome = await safeApiCall<ApiTask>("/tasks", {
      method: "POST",
      body: { reportId: detail.id, volunteerId: assignVolunteerId } as unknown as BodyInit,
    });
    setAssigning(false);
    if (outcome.ok) {
      setDetail(null);
      load();
    } else {
      setAssignError(outcome.error.message);
    }
  };

  const reject = async () => {
    if (!detail) return;
    const outcome = await safeApiCall<ApiReport>(`/reports/${detail.id}/status`, {
      method: "PATCH",
      body: { status: "rejected" } as unknown as BodyInit,
    });
    if (outcome.ok) {
      setDetail(null);
      load();
    } else {
      setStatusError(outcome.error.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold text-[#202923]">
          Search
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94a199]" />
            <input
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Title or location…"
              className="w-full rounded-lg border-[#e1e7e0] bg-white py-2.5 pr-3 pl-9 text-sm text-[#202923] shadow-xs placeholder:text-[#94a199]"
            />
          </div>
        </label>
        <label className="text-xs font-semibold text-[#202923] sm:w-48">
          Status
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
          >
            <option value="">All statuses</option>
            <option value="submitted">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      {result.loading ? (
        <Spinner />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="space-y-3">
          {result.data.items.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onInspect={() => void openDetail(report)}
              footer={
                <>
                  <ReportStatusChip status={report.status} />
                  {report.assignedVolunteerName && (
                    <span className="text-[11px] font-semibold text-[#275b85]">
                      Assigned to {report.assignedVolunteerName}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void openDetail(report)}
                    className="ml-auto rounded-lg border-[#e1e7e0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#202923] hover:bg-[#f7f8f4]"
                  >
                    Manage
                  </button>
                </>
              }
            />
          ))}
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
        </div>
      ) : (
        <EmptyState title="No reports match" description="Try adjusting the search or status filter." />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <ReportStatusChip status={detail.status} />
                <h3 className="mt-2 font-display text-base font-bold text-[#202923]">{detail.title}</h3>
                {detail.description && <p className="mt-1 text-xs text-[#68756d]">{detail.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[#68756d] hover:bg-[#f7f8f4]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {assignError && <DashboardError message={assignError} />}
            {statusError && <DashboardError message={statusError} />}

            <div className="mt-4 space-y-3 rounded-xl border-[#e1e7e0] bg-[#f7f8f4] p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#68756d]">Assign a volunteer</p>
              <select
                value={assignVolunteerId}
                onChange={(event) => setAssignVolunteerId(event.target.value)}
                className="block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923]"
              >
                <option value="">Choose an eligible volunteer…</option>
                {volunteers.map((volunteer) => (
                  <option key={volunteer.id} value={volunteer.id}>
                    {volunteer.name} ({volunteer.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void assign()}
                disabled={!assignVolunteerId || assigning}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
              >
                {assigning ? "Assigning…" : "Assign cleanup task"}
              </button>
              <p className="text-[11px] text-[#94a199]">
                Only active accounts with the Volunteer role appear here.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void reject()}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border-[#f3b6b6] bg-[#fcf0f0] px-4 py-2.5 text-sm font-semibold text-[#c94c4c] hover:bg-[#f9dede]"
            >
              <XCircle className="h-4 w-4" /> Reject report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VerificationQueueSection({ onNavigate }: { onNavigate: (href: string) => void }): React.JSX.Element {
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiReport> | null;
  }>({ loading: true, error: null, data: null });
  const [detail, setDetail] = useState<ApiReport | null>(null);
  const [volunteers, setVolunteers] = useState<ApiUser[]>([]);
  const [assignVolunteerId, setAssignVolunteerId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void safeApiCall<Paginated<ApiReport>>("/reports?status=submitted&page=1&pageSize=20").then((outcome) => {
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (report: ApiReport) => {
    setDetail(report);
    setAssignError(null);
    if (volunteers.length === 0) {
      const list = await safeApiCall<{ items: ApiUser[] }>("/users/volunteers");
      if (list.ok) setVolunteers(list.data.items);
    }
  };

  const assign = async () => {
    if (!detail || !assignVolunteerId) return;
    setAssigning(true);
    const outcome = await safeApiCall<ApiTask>("/tasks", {
      method: "POST",
      body: { reportId: detail.id, volunteerId: assignVolunteerId } as unknown as BodyInit,
    });
    setAssigning(false);
    if (outcome.ok) {
      setDetail(null);
      load();
    } else {
      setAssignError(outcome.error.message);
    }
  };

  return (
    <div className="space-y-5">
      {result.loading ? (
        <Spinner label="Loading verification queue…" />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="space-y-3">
          {result.data.items.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onInspect={() => void openDetail(report)}
              footer={
                <>
                  <span className="text-[11px] font-medium text-[#68756d]">
                    Reported by {report.reporterName}
                  </span>
                  <button
                    type="button"
                    onClick={() => void openDetail(report)}
                    className="ml-auto rounded-lg bg-[#248a61] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1e7452]"
                  >
                    Review & assign
                  </button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Queue is clear"
          description="Every submitted report has been reviewed."
          action={
            <button
              type="button"
              onClick={() => {
                onNavigate("/admin/overview");
                window.history.pushState({}, "", "/admin/overview");
              }}
              className="rounded-lg border-[#e1e7e0] bg-white px-4 py-2 text-xs font-bold text-[#202923] hover:bg-[#f7f8f4]"
            >
              Back to overview
            </button>
          }
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <ReportStatusChip status={detail.status} />
            <h3 className="mt-2 font-display text-base font-bold">{detail.title}</h3>
            {detail.description && <p className="mt-1 text-xs text-[#68756d]">{detail.description}</p>}
            {assignError && <div className="mt-3"><DashboardError message={assignError} /></div>}
            <div className="mt-4 space-y-3 rounded-xl border-[#e1e7e0] bg-[#f7f8f4] p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#68756d]">Assign a volunteer</p>
              <select
                value={assignVolunteerId}
                onChange={(event) => setAssignVolunteerId(event.target.value)}
                className="block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923]"
              >
                <option value="">Choose an eligible volunteer…</option>
                {volunteers.map((volunteer) => (
                  <option key={volunteer.id} value={volunteer.id}>
                    {volunteer.name} ({volunteer.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void assign()}
                disabled={!assignVolunteerId || assigning}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
              >
                {assigning ? "Assigning…" : "Assign cleanup task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksSection(): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiTask> | null;
  }>({ loading: true, error: null, data: null });

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const outcome = await safeApiCall<Paginated<ApiTask>>(`/tasks?${params.toString()}`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (taskId: string) => {
    const outcome = await safeApiCall<ApiTask>(`/tasks/${taskId}/cancel`, { method: "POST" });
    if (outcome.ok) load();
  };

  return (
    <div className="space-y-5">
      <label className="block max-w-xs text-xs font-semibold text-[#202923]">
        Status
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
        >
          <option value="">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>

      {result.loading ? (
        <Spinner />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="space-y-3">
          {result.data.items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              footer={
                <>
                  <span className="text-[11px] font-semibold text-[#275b85]">{task.volunteerName}</span>
                  {task.status !== "completed" && task.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => void cancel(task.id)}
                      className="ml-auto rounded-lg border-[#f3b6b6] bg-[#fcf0f0] px-3 py-1.5 text-[11px] font-bold text-[#c94c4c] hover:bg-[#f9dede]"
                    >
                      Cancel task
                    </button>
                  )}
                </>
              }
            />
          ))}
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
        </div>
      ) : (
        <EmptyState
          title="No tasks yet"
          description="Assign volunteers from the verification queue to create tasks."
        />
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
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const outcome = await safeApiCall<Paginated<ApiApplication>>(`/volunteer-applications?${params.toString()}`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, decision: "approved" | "rejected") => {
    setBusyId(id);
    setActionError(null);
    const outcome = await safeApiCall<{ reviewed: boolean }>(`/volunteer-applications/${id}/review`, {
      method: "PATCH",
      body: { decision } as unknown as BodyInit,
    });
    setBusyId(null);
    if (outcome.ok) load();
    else setActionError(outcome.error.message);
  };

  return (
    <div className="space-y-5">
      <label className="block max-w-xs text-xs font-semibold text-[#202923]">
        Status
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </label>

      {actionError && <DashboardError message={actionError} />}

      {result.loading ? (
        <Spinner />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="space-y-3">
          {result.data.items.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              busy={busyId === application.id}
              onReview={(decision) => void review(application.id, decision)}
            />
          ))}
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
        </div>
      ) : (
        <EmptyState
          title="No applications"
          description="Citizens apply from their dashboard to become volunteers."
        />
      )}
    </div>
  );
}

function ApplicationRow({
  application,
  busy,
  onReview,
}: {
  application: ApiApplication;
  busy: boolean;
  onReview: (decision: "approved" | "rejected") => void;
}): React.JSX.Element {
  const statusStyle =
    application.status === "pending"
      ? "border-[#f4d399] bg-[#fdf5e8] text-[#946215]"
      : application.status === "approved"
        ? "border-[#bde3cf] bg-[#e6f3eb] text-[#163d32]"
        : "border-[#f3b6b6] bg-[#fcf0f0] text-[#9e2f2f]";

  return (
    <article className="rounded-xl border-[#e1e7e0] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}>
            {application.status}
          </span>
          <p className="mt-1.5 text-sm font-bold text-[#202923]">{application.applicant.name}</p>
          <p className="text-xs text-[#68756d]">{application.applicant.email}</p>
          {application.motivation && (
            <p className="mt-2 text-xs leading-relaxed text-[#202923]">{application.motivation}</p>
          )}
        </div>
        {application.status === "pending" && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onReview("approved")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#248a61] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#1e7452] disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              type="button"
              onClick={() => onReview("rejected")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border-[#f3b6b6] bg-[#fcf0f0] px-3 py-2 text-[11px] font-bold text-[#c94c4c] hover:bg-[#f9dede] disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        )}
      </div>
      {application.status === "approved" && (
        <p className="mt-2 text-[11px] font-semibold text-[#163d32]">
          Approved — {application.applicant.name.split(" ")[0]} now has the {ROLE_LABELS.volunteer} role.
        </p>
      )}
    </article>
  );
}

function SettingsSection(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-[#e1e7e0] bg-white p-5">
        <h2 className="font-display text-sm font-bold text-[#202923]">Role policy</h2>
        <ul className="mt-2 space-y-1.5 text-xs text-[#68756d]">
          <li>• Admins can approve volunteers and assign cleanup tasks.</li>
          <li>• Admins cannot create or promote Super Admins.</li>
          <li>• Only a Super Admin can grant admin-level roles.</li>
          <li>• The last Super Admin cannot be demoted.</li>
        </ul>
      </div>
      <div className="rounded-xl border-[#e1e7e0] bg-white p-5">
        <h2 className="font-display text-sm font-bold text-[#202923]">Backend health</h2>
        <p className="mt-1 text-xs text-[#68756d]">
          Public endpoint: <code className="rounded bg-[#f7f8f4] px-1 py-0.5">/api/health</code> (no auth needed).
        </p>
      </div>
    </div>
  );
}
