import React, { useEffect, useState } from "react";
import { ClipboardList, Award, Truck, CheckCircle2, UploadCloud, XCircle } from "lucide-react";
import {
  DashboardShell,
  SummaryCard,
  DashboardError,
  EmptyState,
  Spinner,
  Pagination,
  type DashboardNavItem,
} from "./DashboardShell";
import { TaskCard, PointsAwardedBanner } from "./shared";
import {
  safeApiCall,
  type ApiTask,
  type VolunteerSummary,
  type Paginated,
} from "../../lib/dashboardApi";
import { useSession } from "../../session/SessionProvider";

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "My tasks", href: "/volunteer/tasks", icon: React.createElement(TaskGlyph) },
  { label: "My activity", href: "/volunteer/activity", icon: React.createElement(TruckGlyph) },
  { label: "Points & history", href: "/volunteer/points", icon: React.createElement(AwardGlyph) },
];

function TaskGlyph() {
  return <ClipboardList className="h-4 w-4" />;
}
function TruckGlyph() {
  return <Truck className="h-4 w-4" />;
}
function AwardGlyph() {
  return <Award className="h-4 w-4" />;
}

export function VolunteerDashboard(): React.JSX.Element {
  const { user } = useSession();
  const [activeSection, setActiveSection] = useState(() => {
    const current = window.location.pathname;
    return NAV_ITEMS.find((item) => current.startsWith(item.href))?.href ?? "/volunteer/tasks";
  });

  useEffect(() => {
    const onPop = () => {
      const current = window.location.pathname;
      setActiveSection(NAV_ITEMS.find((item) => current.startsWith(item.href))?.href ?? "/volunteer/tasks");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const titles: Record<string, [string, string]> = {
    "/volunteer/tasks": ["My cleanup tasks", "Accept, start and complete your assigned cleanups."],
    "/volunteer/activity": ["My activity", "Everything you have worked on, newest first."],
    "/volunteer/points": ["Points & history", "Your earned community points and completed cleanups."],
  };

  const [title, subtitle] = titles[activeSection] ?? titles["/volunteer/tasks"];

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      nav={NAV_ITEMS}
      role={user?.role ?? "volunteer"}
    >
      {activeSection === "/volunteer/tasks" && <TasksSection />}
      {activeSection === "/volunteer/activity" && <ActivitySection />}
      {activeSection === "/volunteer/points" && <PointsSection />}
    </DashboardShell>
  );
}

function useVolunteerSummary() {
  const [summary, setSummary] = useState<VolunteerSummary | null>(null);
  useEffect(() => {
    void safeApiCall<VolunteerSummary>("/dashboard/volunteer").then((outcome) => {
      if (outcome.ok) setSummary(outcome.data);
    });
  }, []);
  return summary;
}

function TasksSection(): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiTask> | null;
  }>({ loading: true, error: null, data: null });
  const [actionError, setActionError] = useState<string | null>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);
  const [completeTarget, setCompleteTarget] = useState<ApiTask | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const summary = useVolunteerSummary();

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

  const start = async (taskId: string) => {
    setActionError(null);
    const outcome = await safeApiCall<ApiTask>(`/tasks/${taskId}/start`, {
      method: "POST",
      body: {} as unknown as BodyInit,
    });
    if (outcome.ok) load();
    else setActionError(outcome.error.message);
  };

  const complete = async () => {
    if (!completeTarget || !photoDataUrl) return;
    setSubmitting(true);
    setActionError(null);
    const outcome = await safeApiCall<ApiTask>(`/tasks/${completeTarget.id}/complete`, {
      method: "POST",
      body: { afterPhotoUrl: photoDataUrl, notes: notes || undefined } as unknown as BodyInit,
    });
    setSubmitting(false);
    if (outcome.ok) {
      setAwardedPoints(outcome.data.pointsAwarded);
      setCompleteTarget(null);
      setPhotoDataUrl(null);
      setNotes("");
      load();
    } else {
      setActionError(outcome.error.message);
    }
  };

  const handlePhoto = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setActionError("Photo must be smaller than 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Assigned" value={summary.tasks.assigned} tone="amber" />
          <SummaryCard label="In progress" value={summary.tasks.in_progress} tone="blue" />
          <SummaryCard label="Completed" value={summary.tasks.completed} tone="green" />
          <SummaryCard label="Points" value={summary.points} />
        </div>
      )}

      {awardedPoints !== null && <PointsAwardedBanner points={awardedPoints} />}
      {actionError && <DashboardError message={actionError} />}

      <label className="block max-w-xs text-xs font-semibold text-[#202923]">
        Status
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
            setAwardedPoints(null);
          }}
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
        >
          <option value="">Active & recent</option>
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
                  {task.status === "assigned" && (
                    <button
                      type="button"
                      onClick={() => void start(task.id)}
                      className="rounded-lg bg-[#248a61] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1e7452]"
                    >
                      Accept & start
                    </button>
                  )}
                  {task.status === "in_progress" && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompleteTarget(task);
                        setPhotoDataUrl(null);
                        setNotes("");
                        setActionError(null);
                      }}
                      className="rounded-lg bg-[#248a61] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1e7452]"
                    >
                      Submit evidence & complete
                    </button>
                  )}
                  {task.status === "completed" && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#163d32]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#248a61]" /> Completed
                      {task.completedAt && ` · ${new Date(task.completedAt).toLocaleDateString()}`}
                    </span>
                  )}
                </>
              }
            />
          ))}
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
        </div>
      ) : (
        <EmptyState
          title="No tasks here yet"
          description="When an admin assigns a cleanup to you, it will appear in this list."
        />
      )}

      {completeTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-base font-bold text-[#202923]">Complete cleanup</h3>
              <button
                type="button"
                onClick={() => setCompleteTarget(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[#68756d] hover:bg-[#f7f8f4]"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#68756d]">{completeTarget.report.title}</p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-[#202923]">
                After-cleanup photo (required)
                <div className="mt-1.5">
                  {photoDataUrl ? (
                    <div className="relative overflow-hidden rounded-xl border-[#e1e7e0]">
                      <img src={photoDataUrl} alt="After cleanup" className="max-h-56 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoDataUrl(null)}
                        className="absolute top-2 right-2 rounded-lg bg-white/90 p-1.5 text-[#c94c4c]"
                        aria-label="Remove photo"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e1e7e0] bg-[#f7f8f4] p-6 text-center">
                      <UploadCloud className="h-6 w-6 text-[#248a61]" />
                      <span className="mt-2 text-xs font-semibold text-[#202923]">Upload the cleaned site photo</span>
                      <span className="mt-0.5 text-[11px] text-[#68756d]">PNG or JPG, up to 3 MB</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="mt-3 cursor-pointer text-xs"
                        onChange={(event) => handlePhoto(event.target.files?.[0])}
                      />
                    </div>
                  )}
                </div>
              </label>

              <label className="block text-xs font-semibold text-[#202923]">
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Anything worth recording about the cleanup…"
                  className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void complete()}
              disabled={!photoDataUrl || submitting}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit & complete task"}
            </button>
            <p className="mt-2 text-center text-[11px] text-[#94a199]">
              Completing awards you {`10`} points and marks the report resolved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivitySection(): React.JSX.Element {
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

  return (
    <div className="space-y-4">
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
          <option value="">All</option>
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
            <TaskCard key={task.id} task={task} />
          ))}
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
        </div>
      ) : (
        <EmptyState title="No activity yet" description="Your task history will appear here." />
      )}
    </div>
  );
}

function PointsSection(): React.JSX.Element {
  const summary = useVolunteerSummary();
  const { user, refresh } = useSession();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!summary) return <Spinner label="Loading your history…" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total points" value={summary.points} tone="green" />
        <SummaryCard label="Cleanups completed" value={summary.completed} />
        <SummaryCard label="Active tasks" value={summary.tasks.assigned + summary.tasks.in_progress} tone="blue" />
      </div>
      <div className="rounded-xl border-[#e1e7e0] bg-white p-5">
        <h2 className="font-display text-sm font-bold text-[#202923]">Signed in as</h2>
        <p className="mt-1 text-xs text-[#68756d]">
          {user?.name} · {user?.email}
        </p>
        <p className="mt-2 text-xs text-[#68756d]">
          You earn <strong>10 points</strong> for every verified cleanup you complete with photo evidence.
        </p>
      </div>
    </div>
  );
}
