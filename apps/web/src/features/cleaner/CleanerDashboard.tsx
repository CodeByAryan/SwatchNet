import React from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
} from "lucide-react";
import { ReportItem } from "../reports/ReportFeed";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";

export interface CleanerDashboardProps {
  reports: ReportItem[];
  onInspectReport: (report: ReportItem) => void;
  onUpdateStatus: (id: string, newStatus: ReportItem["status"]) => void;
}

export function CleanerDashboard({
  reports,
  onInspectReport,
  onUpdateStatus,
}: CleanerDashboardProps): React.JSX.Element {
  const pendingCount = reports.filter((r) => r.status === "submitted").length;
  const inProgressCount = reports.filter((r) => r.status === "in_progress").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const actionableReports = reports.filter(
    (r) => r.status === "submitted" || r.status === "in_progress"
  );

  return (
    <div className="section-wrap py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e1e7e0] pb-6 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bad4eb] bg-[#edf4fa] px-3 py-1 text-xs font-semibold text-[#275b85]">
            <Truck className="h-3.5 w-3.5 text-[#3a75a4]" />
            Operations & Field Squad Board
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#202923] sm:text-3xl">
            Cleaner Squad & Dispatch Portal
          </h1>
          <p className="mt-1 text-sm text-[#68756d]">
            Direct route assignment, before-and-after photographic verification, and status updates.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[#e1e7e0] bg-white px-3 py-2 text-xs shadow-2xs">
          <span className="font-semibold text-[#202923]">Field Unit:</span>
          <span className="text-[#248a61]">Ward Squad Beta-4</span>
        </div>
      </div>

      {/* Real Live Metrics Bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#f4d399] bg-[#fdf5e8] p-4 text-left">
          <span className="text-[11px] font-bold tracking-wider text-[#946215] uppercase">
            Awaiting Crew Dispatch
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#946215]">{pendingCount}</span>
            <span className="text-xs text-[#946215]">open reports</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#bad4eb] bg-[#edf4fa] p-4 text-left">
          <span className="text-[11px] font-bold tracking-wider text-[#275b85] uppercase">
            Currently En Route
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#275b85]">{inProgressCount}</span>
            <span className="text-xs text-[#275b85]">active cleanups</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#bde3cf] bg-[#e6f3eb] p-4 text-left">
          <span className="text-[11px] font-bold tracking-wider text-[#163d32] uppercase">
            Verified Cleaned
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#163d32]">{resolvedCount}</span>
            <span className="text-xs text-[#163d32]">closed records</span>
          </div>
        </div>
      </div>

      {/* Field Dispatch Queue */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#202923]">
            Active Field Queue ({actionableReports.length})
          </h2>
          <span className="text-xs text-[#68756d]">Ordered by priority & submission time</span>
        </div>

        <div className="space-y-3">
          {actionableReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e1e7e0] bg-white p-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#248a61]" />
              <p className="mt-2 text-sm font-semibold text-[#202923]">Field queue is clear</p>
              <p className="text-xs text-[#68756d]">All submitted reports have been resolved and verified.</p>
            </div>
          ) : (
            actionableReports.map((report) => (
              <div
                key={report.id}
                className="subtle-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="space-y-1.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} size="sm" />
                    {report.severity === "urgent" && (
                      <span className="rounded-md border border-[#f3b6b6] bg-[#fcf0f0] px-2 py-0.5 text-[11px] font-semibold text-[#c94c4c]">
                        Urgent Action Required
                      </span>
                    )}
                    <span className="text-xs font-semibold text-[#202923]">#{report.id}</span>
                  </div>

                  <h3 className="font-display text-base font-bold text-[#202923]">
                    {report.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#68756d]">
                    <span className="flex items-center gap-1 font-medium text-[#202923]">
                      <MapPin className="h-3.5 w-3.5 text-[#248a61]" />
                      {report.locationName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#94a199]" />
                      {report.reportedAt}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInspectReport(report)}
                  >
                    View Details
                  </Button>

                  {report.status === "submitted" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onUpdateStatus(report.id, "in_progress")}
                    >
                      Accept Route
                    </Button>
                  )}

                  {report.status === "in_progress" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onUpdateStatus(report.id, "resolved")}
                    >
                      Verify & Complete
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
