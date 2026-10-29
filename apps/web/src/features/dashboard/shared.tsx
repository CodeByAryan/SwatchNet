import React from "react";
import { MapPin, Clock, User, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ApiReport, ApiTask, ApiApplication } from "../../lib/dashboardApi";
import { formatDateTime } from "../../lib/dashboardApi";

type ReportStatus = ApiReport["status"];

const REPORT_STATUS_STYLES: Record<ReportStatus, { label: string; className: string; dot: string }> = {
  submitted: {
    label: "Pending review",
    className: "border-[#f4d399] bg-[#fdf5e8] text-[#946215]",
    dot: "bg-[#d99a35]",
  },
  in_progress: {
    label: "In progress",
    className: "border-[#bad4eb] bg-[#edf4fa] text-[#275b85]",
    dot: "bg-[#3a75a4]",
  },
  resolved: {
    label: "Resolved",
    className: "border-[#bde3cf] bg-[#e6f3eb] text-[#163d32]",
    dot: "bg-[#248a61]",
  },
  rejected: {
    label: "Rejected",
    className: "border-[#f3b6b6] bg-[#fcf0f0] text-[#9e2f2f]",
    dot: "bg-[#c94c4c]",
  },
};

export function ReportStatusChip({ status }: { status: ReportStatus }): React.JSX.Element {
  const style = REPORT_STATUS_STYLES[status] ?? {
    label: status,
    className: "border-[#e1e7e0] bg-[#f7f8f4] text-[#68756d]",
    dot: "bg-[#68756d]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}

export function ReportCard({
  report,
  footer,
  onInspect,
}: {
  report: ApiReport;
  /** Optional action row (e.g. assign/verify buttons). */
  footer?: React.ReactNode;
  onInspect?: (report: ApiReport) => void;
}): React.JSX.Element {
  return (
    <article className="rounded-xl border-[#e1e7e0] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ReportStatusChip status={report.status} />
            <span className="rounded-md border-[#e1e7e0] bg-[#f7f8f4] px-2 py-0.5 text-[11px] font-medium text-[#68756d]">
              {report.category.replace(/_/g, " ")}
            </span>
            {report.activeTaskStatus && (
              <span className="rounded-md border-[#bad4eb] bg-[#edf4fa] px-2 py-0.5 text-[11px] font-semibold text-[#275b85]">
                Task: {report.activeTaskStatus.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 font-display text-sm font-bold text-[#202923]">{report.title}</h3>
          {report.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#68756d]">
              {report.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#68756d]">
            <span className="flex items-center gap-1 font-medium text-[#202923]">
              <MapPin className="h-3 w-3 text-[#248a61]" />
              {report.locationName ?? "No landmark given"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#94a199]" />
              {formatDateTime(report.createdAt)}
            </span>
            {onInspect ? (
              <button
                type="button"
                onClick={() => onInspect(report)}
                className="flex items-center gap-1 font-semibold text-[#248a61] hover:underline"
              >
                <ShieldCheck className="h-3 w-3" /> Inspect
              </button>
            ) : (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-[#94a199]" />
                {report.reporterName}
              </span>
            )}
          </div>
        </div>
      </div>
      {footer && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e1e7e0] pt-3">{footer}</div>}
    </article>
  );
}

export function TaskCard({
  task,
  footer,
}: {
  task: ApiTask;
  footer?: React.ReactNode;
}): React.JSX.Element {
  const statusStyles: Record<ApiTask["status"], string> = {
    assigned: "border-[#f4d399] bg-[#fdf5e8] text-[#946215]",
    in_progress: "border-[#bad4eb] bg-[#edf4fa] text-[#275b85]",
    completed: "border-[#bde3cf] bg-[#e6f3eb] text-[#163d32]",
    cancelled: "border-[#f3b6b6] bg-[#fcf0f0] text-[#9e2f2f]",
  };
  const statusLabels: Record<ApiTask["status"], string> = {
    assigned: "Assigned",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <article className="rounded-xl border-[#e1e7e0] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles[task.status]}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${task.status === "assigned"
                ? "bg-[#d99a35]"
                : task.status === "in_progress"
                  ? "bg-[#3a75a4]"
                  : task.status === "completed"
                    ? "bg-[#248a61]"
                    : "bg-[#c94c4c]"
              }`}
            aria-hidden="true"
          />
          {statusLabels[task.status]}
        </span>
        {task.status === "completed" && task.pointsAwarded > 0 && (
          <span className="rounded-md border-[#bde3cf] bg-[#e6f3eb] px-2 py-0.5 text-[11px] font-bold text-[#163d32]">
            +{task.pointsAwarded} pts
          </span>
        )}
        <span className="text-[11px] font-semibold text-[#94a199]">#{task.id.slice(0, 8)}</span>
      </div>

      <h3 className="mt-1.5 font-display text-sm font-bold text-[#202923]">{task.report.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#68756d]">
        <span className="flex items-center gap-1 font-medium text-[#202923]">
          <MapPin className="h-3 w-3 text-[#248a61]" />
          {task.report.locationName ?? "No landmark given"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-[#94a199]" />
          {formatDateTime(task.createdAt)}
        </span>
        {task.volunteerName && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-[#94a199]" />
            {task.volunteerName}
          </span>
        )}
      </div>
      {task.instructions && (
        <p className="mt-2 rounded-lg border-[#e1e7e0] bg-[#f7f8f4] p-2 text-xs text-[#202923]">
          <span className="font-semibold">Instructions:</span> {task.instructions}
        </p>
      )}
      {footer && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e1e7e0] pt-3">{footer}</div>}
    </article>
  );
}

export function ApplicationCard({
  application,
  footer,
}: {
  application: ApiApplication;
  footer?: React.ReactNode;
}): React.JSX.Element {
  const styles: Record<ApiApplication["status"], string> = {
    pending: "border-[#f4d399] bg-[#fdf5e8] text-[#946215]",
    approved: "border-[#bde3cf] bg-[#e6f3eb] text-[#163d32]",
    rejected: "border-[#f3b6b6] bg-[#fcf0f0] text-[#9e2f2f]",
  };

  return (
    <article className="rounded-xl border-[#e1e7e0] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[application.status]}`}
        >
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </span>
        <span className="text-[11px] text-[#94a199]">{formatDateTime(application.createdAt)}</span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[#202923]">
        <span className="font-semibold">{application.applicant.name}</span>
        {application.area && ` · ${application.area}`}
        {application.availability && ` · ${application.availability}`}
      </p>
      <p className="mt-1 line-clamp-3 text-xs text-[#68756d]">{application.motivation}</p>

      {application.reviewNote && (
        <p className="mt-2 rounded-lg border-[#e1e7e0] bg-[#f7f8f4] p-2 text-[11px] text-[#202923]">
          <span className="font-semibold">Review note:</span> {application.reviewNote}
        </p>
      )}
      {footer && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e1e7e0] pt-3">{footer}</div>}
    </article>
  );
}

export function PhotoEvidence({ url, label }: { url: string | null; label: string }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border-[#e1e7e0] bg-[#f7f8f4]">
      <div className="border-b border-[#e1e7e0] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#68756d]">
        {label}
      </div>
      {url ? (
        <img
          src={url}
          alt={label}
          loading="lazy"
          className="h-40 w-full object-cover"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
            if (target.parentElement && !target.parentElement.querySelector(".photo-fallback")) {
              const fallback = document.createElement("div");
              fallback.className = "photo-fallback flex h-40 items-center justify-center text-xs text-[#94a199]";
              fallback.textContent = "Photo unavailable";
              target.parentElement.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-1.5 text-center text-[#94a199]">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-xs">No photo captured</span>
        </div>
      )}
    </div>
  );
}

/** Task completion banner used on the volunteer dashboard after the action succeeds. */
export function PointsAwardedBanner({ points }: { points: number }): React.JSX.Element {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-xl border-[#bde3cf] bg-[#e6f3eb] p-3.5 text-sm text-[#163d32]"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#248a61]" aria-hidden="true" />
      <span>
        Cleanup verified. <strong>{points} points</strong> were added to your profile.
      </span>
    </div>
  );
}
