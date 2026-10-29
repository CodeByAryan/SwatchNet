import React from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";
import { ReportItem } from "./ReportFeed";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SafeImage } from "../../components/ui/SafeImage";
import { Button } from "../../components/ui/Button";

export interface ReportDetailProps {
  report: ReportItem;
  onBack: () => void;
  onUpdateStatus?: (id: string, newStatus: ReportItem["status"]) => void;
}

export function ReportDetail({
  report,
  onBack,
  onUpdateStatus,
}: ReportDetailProps): React.JSX.Element {
  return (
    <div className="section-wrap py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-xs font-semibold text-[#68756d] transition-colors hover:text-[#202923]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to all reports</span>
          </button>

          <span className="text-xs text-[#68756d]">Incident Record #{report.id}</span>
        </div>

        {/* Main detail card */}
        <div className="subtle-card overflow-hidden p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#e1e7e0] pb-6 md:flex-row md:items-start">
            <div className="space-y-2 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={report.status} />
                <span className="rounded-md border border-[#e1e7e0] bg-[#f7f8f4] px-2.5 py-0.5 text-xs font-medium text-[#68756d]">
                  {report.category.replace(/_/g, " ")}
                </span>
                <span className="rounded-md border border-[#f4d399] bg-[#fdf5e8] px-2.5 py-0.5 text-xs font-semibold text-[#946215]">
                  Severity: {report.severity}
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold text-[#202923] sm:text-3xl">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#68756d]">
                <span className="flex items-center gap-1.5 font-medium text-[#202923]">
                  <MapPin className="h-3.5 w-3.5 text-[#248a61]" />
                  {report.locationName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#94a199]" />
                  Reported {report.reportedAt}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#94a199]" />
                  Submitted by {report.reporterName}
                </span>
              </div>
            </div>

            {/* Quick status actions for staff/cleaners */}
            {onUpdateStatus && (
              <div className="flex flex-wrap gap-2">
                {report.status !== "in_progress" && report.status !== "resolved" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onUpdateStatus(report.id, "in_progress")}
                  >
                    Dispatch Squad
                  </Button>
                )}
                {report.status !== "resolved" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onUpdateStatus(report.id, "resolved")}
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="py-6 text-left">
            <h3 className="text-xs font-bold tracking-wider text-[#68756d] uppercase">
              Incident Details & Context
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#202923]">
              {report.description}
            </p>
          </div>

          {/* Visual Evidence (Before & After verification) */}
          <div className="border-t border-[#e1e7e0] pt-6 text-left">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#68756d] uppercase">
                  Photographic Evidence & Geotag Verification
                </h3>
                <p className="text-xs text-[#94a199]">
                  Inspected against GPS coordinates [{report.latitude}, {report.longitude}]
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-2.5 py-0.5 text-[11px] font-semibold text-[#163d32]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#248a61]" />
                Geotag Authenticated
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-[#e1e7e0] bg-[#f7f8f4]">
                <div className="border-b border-[#e1e7e0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#68756d]">
                  Initial Incident Photo (Logged upon report)
                </div>
                {report.imageUrl ? (
                  <SafeImage
                    src={report.imageUrl}
                    alt="Reported site evidence"
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-[#94a199]">
                    No photo uploaded
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#e1e7e0] bg-[#f7f8f4]">
                <div className="border-b border-[#e1e7e0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#68756d]">
                  Resolution Verification Photo (Double-photo proof standard)
                </div>
                {report.status === "resolved" ? (
                  <SafeImage
                    src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"
                    alt="Cleaned public area"
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center p-6 text-center text-xs text-[#68756d]">
                    <Clock className="mb-2 h-6 w-6 text-[#d99a35]" />
                    <span className="font-semibold text-[#202923]">Pending Clearance Proof</span>
                    <span className="mt-1 text-[11px] text-[#94a199]">
                      Assigned team will capture the cleared site to complete verified status.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit trail / Civic log */}
          <div className="mt-8 rounded-xl border border-[#e1e7e0] bg-[#f7f8f4] p-4 text-left">
            <h4 className="text-xs font-bold tracking-wider text-[#68756d] uppercase">
              Verifiable Civic Log
            </h4>
            <div className="mt-3 space-y-2.5 text-xs text-[#202923]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#248a61]" />
                <span className="font-semibold">{report.reportedAt}:</span>
                <span>Report received from resident {report.reporterName}.</span>
              </div>
              {report.verifiedBy && (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3a75a4]" />
                  <span className="font-semibold">Review:</span>
                  <span>Assigned to {report.verifiedBy} for route dispatch.</span>
                </div>
              )}
              {report.resolvedAt && (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#163d32]" />
                  <span className="font-semibold">{report.resolvedAt}:</span>
                  <span>Site cleared and verified with photographic confirmation.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
