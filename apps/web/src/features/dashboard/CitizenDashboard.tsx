import React, { useEffect, useState } from "react";
import { ClipboardList, Award, Search, MapPin, Send, UploadCloud, XCircle, Inbox, CheckCircle2 } from "lucide-react";
import {
  DashboardShell,
  SummaryCard,
  DashboardError,
  EmptyState,
  Spinner,
  Pagination,
  type DashboardNavItem,
} from "./DashboardShell";
import { ReportCard } from "./shared";
import {
  safeApiCall,
  type ApiReport,
  type ApiUser,
  type CitizenSummary,
  type Paginated,
  type ApiApplication,
} from "../../lib/dashboardApi";
import { useSession } from "../../session/SessionProvider";

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: React.createElement(HomeGlyph) },
  { label: "Report garbage", href: "/dashboard/report", icon: React.createElement(SendGlyph) },
  { label: "My reports", href: "/dashboard/reports", icon: React.createElement(ClipboardGlyph) },
  { label: "Volunteer application", href: "/dashboard/volunteer", icon: React.createElement(InboxGlyph) },
  { label: "Profile", href: "/dashboard/profile", icon: React.createElement(AwardGlyph) },
];

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
    </svg>
  );
}
function ClipboardGlyph() {
  return <ClipboardList className="h-4 w-4" />;
}
function InboxGlyph() {
  return <Inbox className="h-4 w-4" />;
}
function AwardGlyph() {
  return <Award className="h-4 w-4" />;
}
function SendGlyph() {
  return <Send className="h-4 w-4" />;
}

const CATEGORIES = [
  { value: "roadside_litter", label: "Roadside litter & plastic" },
  { value: "overflowing_bin", label: "Overflowing public bin" },
  { value: "illegal_dumping", label: "Illegal dumping / debris" },
  { value: "organic_drain_clog", label: "Organic waste / drain clog" },
  { value: "construction_waste", label: "Construction & demolition waste" },
  { value: "hazardous_materials", label: "Hazardous / chemical waste" },
];

export function CitizenDashboard(): React.JSX.Element {
  const { user } = useSession();
  const [activeSection, setActiveSection] = useState(() => {
    const current = window.location.pathname;
    return NAV_ITEMS.find((item) => current.startsWith(item.href))?.href ?? "/dashboard/overview";
  });

  useEffect(() => {
    const onPop = () => {
      const current = window.location.pathname;
      setActiveSection(NAV_ITEMS.find((item) => current.startsWith(item.href))?.href ?? "/dashboard/overview");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const titles: Record<string, [string, string]> = {
    "/dashboard/overview": ["My overview", "Your reports and their progress at a glance."],
    "/dashboard/report": ["Report garbage", "Submit a geotagged report with a photo."],
    "/dashboard/reports": ["My reports", "Track every report you have submitted."],
    "/dashboard/volunteer": ["Become a volunteer", "Apply to help with cleanups in your area."],
    "/dashboard/profile": ["Profile", "Your account details."],
  };

  const [title, subtitle] = titles[activeSection] ?? titles["/dashboard/overview"];

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      nav={NAV_ITEMS}
      role={user?.role ?? "user"}
    >
      {activeSection === "/dashboard/overview" && <OverviewSection onNavigate={setActiveSection} />}
      {activeSection === "/dashboard/report" && <ReportFormSection onSubmitted={() => setActiveSection("/dashboard/reports")} />}
      {activeSection === "/dashboard/reports" && <MyReportsSection onNewReport={() => setActiveSection("/dashboard/report")} />}
      {activeSection === "/dashboard/volunteer" && <VolunteerApplicationSection />}
      {activeSection === "/dashboard/profile" && <ProfileSection />}
    </DashboardShell>
  );
}

function useCitizenSummary() {
  const [summary, setSummary] = useState<CitizenSummary | null>(null);
  useEffect(() => {
    void safeApiCall<{ summary: CitizenSummary }>("/dashboard/me/summary").then((outcome) => {
      if (outcome.ok) setSummary(outcome.data.summary);
    });
  }, []);
  return summary;
}

function OverviewSection({ onNavigate }: { onNavigate: (href: string) => void }): React.JSX.Element {
  const summary = useCitizenSummary();
  const [recent, setRecent] = useState<ApiReport[]>([]);

  useEffect(() => {
    void safeApiCall<Paginated<ApiReport>>("/reports/mine?page=1&pageSize=4").then((outcome) => {
      if (outcome.ok) setRecent(outcome.data.items);
    });
  }, []);

  return (
    <div className="space-y-8">
      {summary && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">My reports</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total" value={summary.reports.total} />
            <SummaryCard label="Pending" value={summary.reports.submitted} tone="amber" />
            <SummaryCard label="In progress" value={summary.reports.inProgress} tone="blue" />
            <SummaryCard label="Resolved" value={summary.reports.resolved} tone="green" />
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onNavigate("/dashboard/report");
            window.history.pushState({}, "", "/dashboard/report");
            window.scrollTo({ top: 0 });
          }}
          className="rounded-xl border-[#bde3cf] bg-[#e6f3eb] p-5 text-left transition-colors hover:bg-[#d8ecdf]"
        >
          <span className="text-sm font-bold text-[#163d32]">Report garbage</span>
          <p className="mt-1 text-xs text-[#163d32]">Spotted waste in a public space? File a geotagged report.</p>
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate("/dashboard/reports");
            window.history.pushState({}, "", "/dashboard/reports");
            window.scrollTo({ top: 0 });
          }}
          className="rounded-xl border-[#bad4eb] bg-[#edf4fa] p-5 text-left transition-colors hover:bg-[#e1eef8]"
        >
          <span className="text-sm font-bold text-[#275b85]">Track my reports</span>
          <p className="mt-1 text-xs text-[#275b85]">See what has been picked up and what is pending.</p>
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#68756d]">My latest reports</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="You have not reported anything yet"
            description="Your submitted reports will appear here."
            action={
              <button
                type="button"
                onClick={() => {
                  onNavigate("/dashboard/report");
                  window.history.pushState({}, "", "/dashboard/report");
                }}
                className="rounded-lg bg-[#248a61] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e7452]"
              >
                Report garbage
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recent.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReportFormSection({ onSubmitted }: { onSubmitted: () => void }): React.JSX.Element {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not read your location. Enter a landmark instead.");
      },
      { timeout: 8000 },
    );
  };

  const handlePhoto = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Photo must be smaller than 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (title.trim().length < 4) {
      setError("Please give the report a short title.");
      return;
    }
    if (!coords) {
      setError("Please detect your location before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const outcome = await safeApiCall<ApiReport>("/reports", {
      method: "POST",
      body: {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        latitude: coords.lat,
        longitude: coords.lng,
        locationName: locationName.trim() || undefined,
      } as unknown as BodyInit,
    });
    setSubmitting(false);
    if (outcome.ok) onSubmitted();
    else setError(outcome.error.message);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {error && <DashboardError message={error} />}

      <label className="block text-xs font-semibold text-[#202923]">
        Title *
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Overflowing bins near the bus stop"
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#202923]">
          Category *
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm font-medium text-[#202923] shadow-xs"
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[#202923]">
          Landmark / area
          <div className="relative mt-1">
            <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94a199]" />
            <input
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              placeholder="e.g. Opposite sector 4 bus stop"
              className="block w-full rounded-lg border-[#e1e7e0] bg-white py-2.5 pr-3 pl-9 text-sm text-[#202923] shadow-xs"
            />
          </div>
        </label>
      </div>

      <div className="rounded-xl border-[#e1e7e0] bg-[#f7f8f4] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#202923]">Location</span>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="rounded-lg border-[#e1e7e0] bg-white px-3 py-1.5 text-xs font-semibold text-[#248a61] hover:bg-[#e6f3eb] disabled:opacity-50"
          >
            {locating ? "Detecting…" : "Use my location"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#68756d]">
          {coords ? `Lat ${coords.lat}, Lng ${coords.lng}` : "Location not detected yet."}
        </p>
      </div>

      <label className="block text-xs font-semibold text-[#202923]">
        Photo (recommended)
        {photoDataUrl ? (
          <div className="relative mt-1.5 overflow-hidden rounded-xl border-[#e1e7e0]">
            <img src={photoDataUrl} alt="Reported waste" className="max-h-60 w-full object-cover" />
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
          <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e1e7e0] bg-[#f7f8f4] p-6 text-center">
            <UploadCloud className="h-6 w-6 text-[#248a61]" />
            <span className="mt-2 text-xs font-semibold text-[#202923]">Upload a photo of the waste</span>
            <span className="mt-0.5 text-[11px] text-[#68756d]">PNG or JPG, up to 3 MB</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-3 cursor-pointer text-xs"
              onChange={(event) => handlePhoto(event.target.files?.[0])}
            />
          </div>
        )}
      </label>

      <label className="block text-xs font-semibold text-[#202923]">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Access conditions, volume estimate, how long it has been there…"
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
        />
      </label>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Submitting…" : "Submit report"}
      </button>
    </div>
  );
}

function MyReportsSection({ onNewReport }: { onNewReport: () => void }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    loading: boolean;
    error: string | null;
    data: Paginated<ApiReport> | null;
  }>({ loading: true, error: null, data: null });

  const load = React.useCallback(() => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    void (async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (query.trim()) params.set("search", query.trim());
      if (statusFilter) params.set("status", statusFilter);
      const outcome = await safeApiCall<Paginated<ApiReport>>(`/reports/mine?${params.toString()}`);
      if (outcome.ok) setResult({ loading: false, error: null, data: outcome.data });
      else setResult({ loading: false, error: outcome.error.message, data: null });
    })();
  }, [page, query, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

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
              className="w-full rounded-lg border-[#e1e7e0] bg-white py-2.5 pr-3 pl-9 text-sm text-[#202923] shadow-xs"
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
        <button
          type="button"
          onClick={onNewReport}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#248a61] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1e7452]"
        >
          New report
        </button>
      </div>

      {result.loading ? (
        <Spinner />
      ) : result.error ? (
        <DashboardError message={result.error} onRetry={load} />
      ) : result.data && result.data.items.length > 0 ? (
        <div className="space-y-3">
          {result.data.items.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
          <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />
        </div>
      ) : (
        <EmptyState
          title="No reports yet"
          description="Anything you report will show up here with its current status."
          action={
            <button
              type="button"
              onClick={onNewReport}
              className="rounded-lg bg-[#248a61] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e7452]"
            >
              Report garbage
            </button>
          }
        />
      )}
    </div>
  );
}

function VolunteerApplicationSection(): React.JSX.Element {
  const { refresh } = useSession();
  const [motivation, setMotivation] = useState("");
  const [area, setArea] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(() => {
    void safeApiCall<{ items: ApiApplication[] }>("/volunteer-applications/mine").then((outcome) => {
      setLoading(false);
      if (outcome.ok) {
        setExisting(outcome.data.items);
        const pending = outcome.data.items.find((item) => item.status === "pending");
        if (pending) setSubmitted(true);
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (motivation.trim().length < 20) {
      setError("Please describe your motivation in at least 20 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const outcome = await safeApiCall<ApiApplication>("/volunteer-applications", {
      method: "POST",
      body: {
        motivation: motivation.trim(),
        area: area.trim() || undefined,
        availability: availability.trim() || undefined,
      } as unknown as BodyInit,
    });
    setSubmitting(false);
    if (outcome.ok) {
      setSubmitted(true);
      setMotivation("");
      load();
      void refresh();
    } else {
      setError(outcome.error.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-xl border-[#bde3cf] bg-[#e6f3eb] p-4 text-xs text-[#163d32]">
        Volunteers pick up cleanup tasks assigned by admins. Applying does not change your role — an
        admin reviews every application first.
      </div>

      {submitted && existing.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#68756d]">My applications</h2>
          {existing.map((application) => (
            <div key={application.id} className="rounded-xl border-[#e1e7e0] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${application.status === "pending"
                      ? "border-[#f4d399] bg-[#fdf5e8] text-[#946215]"
                      : application.status === "approved"
                        ? "border-[#bde3cf] bg-[#e6f3eb] text-[#163d32]"
                        : "border-[#f3b6] bg-[#fcf0f0] text-[#9e2f2f]"
                    }`}
                >
                  {application.status}
                </span>
                <span className="text-[11px] text-[#94a199]">
                  {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-xs text-[#202923]">{application.motivation}</p>
              {application.reviewNote && (
                <p className="mt-1.5 text-[11px] text-[#68756d]">
                  <strong>Review:</strong> {application.reviewNote}
                </p>
              )}
              {application.status === "approved" && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#163d32]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#248a61]" /> You are now a volunteer — sign out and
                  back in to see your new workspace.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!submitted && (
        <>
          {error && <DashboardError message={error} />}
          <label className="block text-xs font-semibold text-[#202923]">
            Why do you want to volunteer? *
            <textarea
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              rows={4}
              placeholder="Tell the admins about your availability, area and motivation…"
              className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#202923]">
              Your area
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="e.g. Ward 12, Riverside"
                className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
              />
            </label>
            <label className="block text-xs font-semibold text-[#202923]">
              Availability
              <input
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                placeholder="e.g. Weekend mornings"
                className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </>
      )}
    </div>
  );
}

function ProfileSection(): React.JSX.Element {
  const { user, refresh, signOut } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [area, setArea] = useState(user?.area ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const outcome = await safeApiCall<ApiUser>("/auth/me", {
      method: "PATCH",
      body: {
        name: name.trim() || undefined,
        phone: phone.trim() || null,
        area: area.trim() || null,
      } as unknown as BodyInit,
    });
    setSaving(false);
    if (outcome.ok) {
      setSaved(true);
      void refresh();
    } else {
      setError(outcome.error.message);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-lg border-[#bde3cf] bg-[#e6f3eb] px-3 py-2.5 text-xs font-semibold text-[#163d32]">
          <CheckCircle2 className="h-4 w-4" /> Profile updated.
        </p>
      )}
      {error && <DashboardError message={error} />}

      <div className="rounded-xl border-[#e1e7e0] bg-white p-5">
        <h2 className="font-display text-sm font-bold text-[#202923]">Account</h2>
        <p className="mt-1 text-xs text-[#68756d]">{user?.email} · signed in with Google</p>
      </div>

      <label className="block text-xs font-semibold text-[#202923]">
        Display name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
        />
      </label>
      <label className="block text-xs font-semibold text-[#202923]">
        Phone (optional)
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
        />
      </label>
      <label className="block text-xs font-semibold text-[#202923]">
        Area (optional)
        <input
          value={area}
          onChange={(event) => setArea(event.target.value)}
          className="mt-1 block w-full rounded-lg border-[#e1e7e0] bg-white px-3 py-2.5 text-sm text-[#202923] shadow-xs"
        />
      </label>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>

      <button
        type="button"
        onClick={() => {
          void signOut();
          window.location.assign("/");
        }}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border-[#f3b6b6] bg-[#fcf0f0] px-4 py-2.5 text-sm font-semibold text-[#c94c4c] hover:bg-[#f9dede]"
      >
        Sign out
      </button>
    </div>
  );
}
