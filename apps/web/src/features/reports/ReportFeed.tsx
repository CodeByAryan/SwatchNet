import React, { useState } from "react";
import {
  MapPin,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SafeImage } from "../../components/ui/SafeImage";

export interface ReportItem {
  id: string;
  title: string;
  category: string;
  status: "submitted" | "in_progress" | "resolved" | "rejected";
  locationName: string;
  latitude: number;
  longitude: number;
  severity: "low" | "medium" | "high" | "urgent";
  reportedAt: string;
  reporterName: string;
  description: string;
  imageUrl?: string;
  verifiedBy?: string;
  resolvedAt?: string;
}

export interface ReportFeedProps {
  reports: ReportItem[];
  /** Loading/error state from the API; no demo rows are ever substituted. */
  status?: "loading" | "ready" | "error";
  isSignedIn?: boolean;
  onNewReportClick: () => void;
  onSelectReport: (report: ReportItem) => void;
  onSignInClick?: () => void;
  onRetry?: () => void;
}

export function ReportFeed({
  reports,
  status = "ready",
  isSignedIn = false,
  onNewReportClick,
  onSelectReport,
  onSignInClick,
  onRetry,
}: ReportFeedProps): React.JSX.Element {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="section-wrap py-8 sm:py-12">
      {/* Feed Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#e1e7e0] pb-6 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bde3cf] bg-[#e6f3eb] px-3 py-1 text-xs font-semibold text-[#163d32]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#248a61]" />
            Verifiable Public Log
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#202923] sm:text-3xl">
            Civic Waste & Resolution Feed
          </h1>
          <p className="mt-1 text-sm text-[#68756d]">
            Real-time community reports, dispatch status, and verified photographic proof of
            cleanups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={onNewReportClick} className="group">
            <Plus className="h-4 w-4" />
            <span>{isSignedIn ? "File New Report" : "Sign up to report"}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e1e7e0] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#68756d]" />
          <input
            type="text"
            placeholder="Search by title, street, or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-[#f7f8f4] py-1.5 pr-3 pl-9 text-xs text-[#202923] placeholder-[#94a199] focus:border-[#248a61] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Reports" },
            { id: "submitted", label: "Pending" },
            { id: "in_progress", label: "In Progress" },
            { id: "resolved", label: "Resolved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${filterStatus === tab.id
                  ? "bg-[#163d32] text-white"
                  : "bg-transparent text-[#68756d] hover:bg-[#f7f8f4] hover:text-[#202923]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="mt-6 space-y-4">
        {status === "loading" ? (
          <div className="flex items-center justify-center gap-3 py-12" role="status">
            <span className="h-6 w-6 animate-spin rounded-full border-4 border-[#e1e7e0] border-t-[#248a61]" />
            <span className="text-sm text-[#68756d]">Loading reports…</span>
          </div>
        ) : status === "error" ? (
          <div role="alert" className="rounded-2xl border-[#f3b6b6] bg-[#fcf0f0] p-8 text-center">
            <p className="text-sm font-semibold text-[#9a3434]">Could not load the civic feed</p>
            <p className="mt-1 text-xs text-[#9a3434]">
              The report service did not respond. Your data has not changed.
            </p>
            {onRetry && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Try again
                </Button>
              </div>
            )}
          </div>
        ) : !isSignedIn ? (
          <div className="rounded-2xl border border-dashed border-[#e1e7e0] bg-white p-12 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-[#248a61]" />
            <p className="mt-2 text-sm font-semibold text-[#202923]">Sign in to view the civic feed</p>
            <p className="mt-1 text-xs text-[#68756d]">
              Reports contain resident locations, so the feed is available to signed-in members.
            </p>
            {onSignInClick && (
              <div className="mt-4">
                <Button variant="primary" size="sm" onClick={onSignInClick}>
                  Continue with Google
                </Button>
              </div>
            )}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e1e7e0] bg-white p-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-[#94a199]" />
            <p className="mt-2 text-sm font-semibold text-[#202923]">No reports matched your criteria</p>
            <p className="text-xs text-[#68756d]">Try adjusting your search terms or filter selection.</p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="interactive-card cursor-pointer p-5 transition-all"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left block: details */}
                <div className="flex flex-1 gap-4">
                  {report.imageUrl && (
                    <div className="hidden h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[#e1e7e0] bg-[#f7f8f4] sm:block">
                      <SafeImage
                        src={report.imageUrl}
                        alt={report.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={report.status} size="sm" />
                      <span className="rounded-md border border-[#e1e7e0] bg-[#f7f8f4] px-2 py-0.5 text-[11px] font-medium text-[#68756d]">
                        {report.category.replace(/_/g, " ")}
                      </span>
                      {report.severity === "urgent" && (
                        <span className="rounded-md border border-[#f3b6b6] bg-[#fcf0f0] px-2 py-0.5 text-[11px] font-semibold text-[#c94c4c]">
                          Urgent Priority
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-base font-bold text-[#202923] hover:text-[#248a61]">
                      {report.title}
                    </h3>

                    <p className="line-clamp-2 text-xs leading-relaxed text-[#68756d]">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[#68756d]">
                      <span className="flex items-center gap-1 font-medium text-[#202923]">
                        <MapPin className="h-3 w-3 text-[#248a61]" />
                        {report.locationName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#94a199]" />
                        {report.reportedAt}
                      </span>
                      {report.verifiedBy && (
                        <span className="flex items-center gap-1 font-medium text-[#163d32]">
                          <ShieldCheck className="h-3 w-3 text-[#248a61]" />
                          {report.verifiedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right button */}
                <div className="flex items-center justify-end sm:flex-col sm:items-end">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#248a61] hover:underline">
                    <span>Inspect</span>
                    <Eye className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
