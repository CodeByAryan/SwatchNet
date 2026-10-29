import React, { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HeroSection } from "./components/home/HeroSection";
import { HowItWorksSection } from "./components/home/HowItWorksSection";
import { OurImpactSection } from "./components/home/OurImpactSection";
import { CommunityCtaSection } from "./components/home/CommunityCtaSection";
import { PlaceholderModal, ModalType } from "./components/ui/PlaceholderModal";
import { ReportFeed, type ReportItem } from "./features/reports/ReportFeed";
import { ReportSubmission, ReportSubmissionData } from "./features/reports/ReportSubmission";

import { apiRequest } from "./lib/api";
import { safeApiCall, type ApiReport, type Paginated } from "./lib/dashboardApi";
import { useSession, dashboardPathForRole } from "./session/SessionProvider";
import { AuthSplash, LoginPage, SignupPage } from "./pages/AuthPages";
import { ProtectedRoute, PublicOnlyRoute, NotFoundPage, AccessDenied } from "./routing/guards";
import { AdminDashboard } from "./features/dashboard/AdminDashboard";
import { SuperAdminDashboard } from "./features/dashboard/SuperAdminDashboard";
import { VolunteerDashboard } from "./features/dashboard/VolunteerDashboard";
import { CitizenDashboard } from "./features/dashboard/CitizenDashboard";
import { hasRoleAtLeast } from "./session/roles";

type ActiveTab = "home" | "feed" | "report" | "cleaner";

/** Signed-in users landing on the public site go straight to their dashboard. */
function useRedirectSignedInUsers() {
  const { user, loading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    const dashboard = dashboardPathForRole(user.role);
    if (location.pathname.startsWith(dashboard)) return;
    // Public pages listed here are still visible to signed-in users.
    if (location.pathname === "/" || location.pathname === "") return;
    if (location.pathname.startsWith("/auth")) {
      navigate(dashboard, { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);
}

export default function App(): React.JSX.Element {
  const { user, signOut } = useSession();
  useRedirectSignedInUsers();

  const [currentTab, setCurrentTab] = React.useState<ActiveTab>("home");
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [feedState, setFeedState] = React.useState<"loading" | "ready" | "error">("loading");

  // The public feed reads the real report table. It is behind auth on the API, so
  // a signed-out visitor gets an honest empty state rather than demo rows.
  const loadFeed = React.useCallback(() => {
    if (!user) {
      setReports([]);
      setFeedState("ready");
      return;
    }
    setFeedState("loading");
    void (async () => {
      const outcome = await safeApiCall<Paginated<ApiReport>>("/reports?page=1&pageSize=20");
      if (!outcome.ok) {
        setFeedState("error");
        return;
      }
      setReports(outcome.data.items.map(toFeedItem));
      setFeedState("ready");
    })();
  }, [user]);

  React.useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const [apiStatus, setApiStatus] = React.useState<"connected" | "connecting" | "offline">("connecting");
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    type: ModalType;
    title?: string;
    description?: string;
  }>({ isOpen: false, type: null });

  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/volunteer") ||
    location.pathname.startsWith("/admin");

  // Verify backend health on initial load (falls back cleanly if offline).
  React.useEffect(() => {
    let mounted = true;
    apiRequest<{ status?: string; data?: { status: string } }>("health")
      .then((res) => {
        if (mounted && (res?.status === "ok" || res?.data?.status === "ok")) {
          setApiStatus("connected");
        }
      })
      .catch(() => {
        if (mounted) setApiStatus("offline");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0 });
  };

  const handleTabChange = (tab: ActiveTab) => {
    setCurrentTab(tab);
    navigateTo(tab === "home" ? "/" : `/${tab === "feed" ? "feed" : tab}`);
  };

  const handleOpenReportSubmission = () => {
    if (user) navigateTo("/dashboard/report");
    else handleTabChange("report");
  };

  const handleOpenAuth = (mode: "signin" | "signup" = "signin") => {
    navigateTo(mode === "signup" ? "/auth/signup" : "/auth/signin");
  };

  const handleOpenFeed = () => handleTabChange("feed");

  /** Feed rows open the record in the appropriate workspace. */
  const handleSelectReport = (_report: ReportItem) => {
    navigateTo(user ? "/dashboard/reports" : "/auth/signin");
  };

  /** Signed-out visitors are sent to signup; reporting always writes to the API. */
  const handleCreateReport = (_data: ReportSubmissionData) => {
    handleOpenAuth("signup");
  };



  const handleOpenInfoModal = () => {
    setModalState({
      isOpen: true,
      type: "info",
      title: "Community Guidelines & Verification Standards",
      description:
        "SwatchNet adheres to open civic principles and double photo verification standards for all cleanups across participating districts.",
    });
  };

  const handleCloseModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  const handleScrollToHowItWorks = () => {
    document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  // Dashboard routes render their own chrome (sidebar), not the public navbar.
  if (isDashboardRoute) {
    return (
      <Routes>
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute minimumRole="user">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/*"
          element={
            <ProtectedRoute minimumRole="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute minimumRole="admin">
              <AdminRoutes />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f4] text-[#202923] selection:bg-[#163d32] selection:text-white">
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        apiStatus={apiStatus}
        onSignInClick={() => handleOpenAuth("signin")}
        onSignUpClick={() => handleOpenAuth("signup")}
        user={user ?? undefined}
        onSignOut={signOut}
      />

      <main className="flex-grow">
        <Routes>
          {/* Public pages */}
          <Route
            path="/"
            element={
              <>
                <HeroSection
                  onReportClick={handleOpenReportSubmission}
                  onExploreFeedClick={handleOpenFeed}
                  onHowItWorksClick={handleScrollToHowItWorks}
                />
                <HowItWorksSection onReportClick={handleOpenReportSubmission} />
                <OurImpactSection />
                <CommunityCtaSection onReportClick={handleOpenReportSubmission} onSignInClick={() => handleOpenAuth("signin")} />
              </>
            }
          />
          <Route
            path="/feed"
            element={
              <ReportFeed
                reports={reports}
                status={feedState}
                isSignedIn={Boolean(user)}
                onNewReportClick={handleOpenReportSubmission}
                onSelectReport={handleSelectReport}
                onSignInClick={() => handleOpenAuth("signin")}
                onRetry={loadFeed}
              />
            }
          />
          <Route
            path="/report"
            element={
              <ReportSubmission onCancel={() => handleTabChange("home")} onSubmitSuccess={handleCreateReport} />
            }
          />
          {/* Legacy cleaner board: volunteers now use the real /volunteer workspace. */}
          <Route path="/cleaner" element={<ProtectedRoute minimumRole="volunteer"><Navigate to="/volunteer/tasks" replace /></ProtectedRoute>} />

          {/* Single shared auth pages */}
          <Route
            path="/auth/signin"
            element={
              <PublicOnlyRoute>
                <LoginPage
                  callbackError={
                    new URLSearchParams(window.location.search).get("auth_error") ??
                    new URLSearchParams(window.location.search).get("error") ??
                    undefined
                  }
                  onExitPublicSite={() => navigateTo("/")}
                  onSwitchMode={(mode) => navigateTo(mode === "signup" ? "/auth/signup" : "/auth/signin")}
                />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage
                  callbackError={
                    new URLSearchParams(window.location.search).get("auth_error") ??
                    new URLSearchParams(window.location.search).get("error") ??
                    undefined
                  }
                  onExitPublicSite={() => navigateTo("/")}
                  onSwitchMode={(mode) => navigateTo(mode === "signup" ? "/auth/signup" : "/auth/signin")}
                />
              </PublicOnlyRoute>
            }
          />
          {/* Neon Auth OAuth returns here; resolve the SDK session and API profile. */}
          <Route path="/auth/callback" element={<OAuthCallbackBridge />} />

          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer
        onReportClick={handleOpenReportSubmission}
        onSignInClick={() => handleOpenAuth("signin")}
        onOpenFeed={handleOpenFeed}
        onOpenInfo={handleOpenInfoModal}
      />

      <PlaceholderModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        description={modalState.description}
        onClose={handleCloseModal}
        onNavigateToReport={handleOpenReportSubmission}
        onNavigateToAuth={() => handleOpenAuth("signin")}
      />
    </div>
  );
}

/** Maps an API report onto the public feed's display model. */
function toFeedItem(report: ApiReport): ReportItem {
  return {
    id: report.id,
    title: report.title,
    description: report.description ?? "",
    category: report.category,
    status: report.status,
    locationName: report.locationName ?? "Location shared by reporter",
    latitude: report.latitude,
    longitude: report.longitude,
    severity: "medium",
    reportedAt: new Date(report.createdAt).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    reporterName: report.reporterName,
    imageUrl: undefined,
    verifiedBy: report.assignedVolunteerName ?? undefined,
  };
}

/**
 * Completes the Google round-trip: /auth/callback → profile sync → dashboard.
 * Profile identity is verified with Neon Auth's JWT on the backend. The API
 * returns the database role, then the session provider routes to its dashboard.
 */
function OAuthCallbackBridge(): React.JSX.Element {
  const { completeSignIn, refresh } = useSession();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await completeSignIn();
        await refresh();
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Sign-in could not be completed.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [completeSignIn, refresh]);

  if (error) {
    return (
      <div className="section-wrap flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-display text-xl font-bold text-[#202923]">Sign-in could not be completed</h1>
        <p className="max-w-md text-sm text-[#68756d]">{error}</p>
        <a
          href="/auth/signin"
          className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-[#248a61] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e7452]"
        >
          Try again
        </a>
      </div>
    );
  }

  return <AuthSplash label="Finishing sign-in…" />;
}

/** /admin is Admin-only; /admin/super additionally requires the Super Admin role. */
function AdminRoutes(): React.JSX.Element {
  const { user } = useSession();
  const location = useLocation();
  const isSuperSection = location.pathname.startsWith("/admin/super");

  if (isSuperSection && user && !hasRoleAtLeast(user.role, "super_admin")) {
    return <AccessDenied requiredRole="super_admin" />;
  }

  if (isSuperSection) {
    return <SuperAdminDashboard />;
  }
  return <AdminDashboard />;
}
