import React, { useEffect, useState } from "react";
import { ArrowLeft, Trees, ShieldCheck, AlertTriangle } from "lucide-react";
import { GoogleAuthButton } from "../features/auth/GoogleAuthButton";
import { getCurrentSessionUser, isAuthConfigured } from "../lib/auth";
import { useSession, dashboardPathForRole } from "../session/SessionProvider";

export type AuthPageMode = "signin" | "signup";

interface AuthPageProps {
  /** One-time OAuth callback state from the URL (already handled upstream). */
  callbackError?: string;
  onExitPublicSite: () => void;
  onSwitchMode: (mode: AuthPageMode) => void;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled or the account was not granted access.",
  state_mismatch: "The sign-in link expired. Please start again.",
  signup_disabled: "New Google sign-ups are disabled for this environment.",
};

function describeError(code?: string): string {
  if (!code) return "Google sign-in could not be completed. Please try again.";
  return AUTH_ERROR_MESSAGES[code] ?? "Google sign-in could not be completed. Please try again.";
}

/**
 * The single shared login page. Every role signs in here; the backend decides
 * which dashboard the account is routed to — never the client.
 */
export function LoginPage({ callbackError, onExitPublicSite, onSwitchMode }: AuthPageProps): React.JSX.Element {
  const { completeSignIn, user, refresh } = useSession();
  const [error, setError] = useState<string | null>(callbackError ? describeError(callbackError) : null);

  useEffect(() => {
    if (callbackError) return;
    let active = true;
    void (async () => {
      try {
        const sessionUser = await getCurrentSessionUser();
        if (!sessionUser) return;
        await completeSignIn();
        if (active) await refresh();
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Sign-in could not be completed.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [callbackError, completeSignIn, refresh]);

  useEffect(() => {
    if (user) window.location.assign(dashboardPathForRole(user.role));
  }, [user]);



  return (
    <AuthLayout onExitPublicSite={onExitPublicSite} badge="Secure sign-in">
      <h1 className="font-display text-2xl font-bold text-[#202923]">Welcome back</h1>
      <p className="mt-1.5 text-sm text-[#68756d]">
        Sign in with Google to reach your SwatchNet workspace. Everyone uses this same page.
      </p>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mt-6">
        {isAuthConfigured ? (
          <GoogleAuthButton mode="signIn" onCancelled={() => setError(null)} />
        ) : (
          <ErrorBanner message="Neon Auth is not configured. Set VITE_NEON_AUTH_URL from Neon Console." />
        )}
      </div>

      <p className="mt-6 text-center text-xs text-[#68756d]">
        New to SwatchNet?{" "}
        <button
          type="button"
          onClick={() => onSwitchMode("signup")}
          className="cursor-pointer font-semibold text-[#248a61] underline-offset-2 hover:underline"
        >
          Create an account
        </button>
      </p>

      <AuthFooterNote />
    </AuthLayout>
  );
}

/**
 * The single shared signup page. Collects only the optional profile details the
 * platform actually uses. There is no role selector: every new account starts
 * with the backend-assigned default `user` role.
 */
export function SignupPage({ callbackError, onExitPublicSite, onSwitchMode }: AuthPageProps): React.JSX.Element {
  const { completeSignIn, user, refresh } = useSession();
  const [error, setError] = useState<string | null>(callbackError ? describeError(callbackError) : null);



  // After returning from Google, create the profile with the entered fields.
  useEffect(() => {
    if (callbackError) return;
    let active = true;
    void (async () => {
      const sessionUser = await getCurrentSessionUser();
      if (!sessionUser || !active) return;
      try {
        await completeSignIn();
        if (active) await refresh();
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Sign-up could not be completed.");
      }
    })();
    return () => {
      active = false;
    };
  }, [callbackError, completeSignIn, refresh]);

  useEffect(() => {
    if (user) window.location.assign(dashboardPathForRole(user.role));
  }, [user]);

  return (
    <AuthLayout onExitPublicSite={onExitPublicSite} badge="Create account">
      <h1 className="font-display text-2xl font-bold text-[#202923]">Join SwatchNet</h1>
      <p className="mt-1.5 text-sm text-[#68756d]">
        One account for reporting waste, tracking cleanups, and — after a quick review — volunteering.
      </p>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mt-6 space-y-4">
        {isAuthConfigured ? (
          <GoogleAuthButton mode="signUp" onCancelled={() => setError(null)} />
        ) : (
          <ErrorBanner message="Neon Auth is not configured. Set VITE_NEON_AUTH_URL from Neon Console." />
        )}
        <p className="text-center text-[11px] text-[#68756d]">
          Neon Auth verifies your Google identity. You can edit optional profile details after sign-up.
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-[#68756d]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitchMode("signin")}
          className="cursor-pointer font-semibold text-[#248a61] underline-offset-2 hover:underline"
        >
          Sign in
        </button>
      </p>

      <div className="mt-5 rounded-xl border-[#bde3cf] bg-[#e6f3eb] p-3 text-[11px] leading-relaxed text-[#163d32]">
        <strong>New accounts start as citizens.</strong> Volunteer and admin access are granted by
        reviewers — never chosen at signup.
      </div>

      <AuthFooterNote />
    </AuthLayout>
  );
}

export function AuthSplash({ label }: { label: string }): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f8f4] px-6">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#e1e7e0] border-t-[#248a61]" role="status" />
      <p className="text-sm font-medium text-[#68756d]">{label}</p>
    </div>
  );
}

function AuthLayout({
  children,
  onExitPublicSite,
  badge,
}: {
  children: React.ReactNode;
  onExitPublicSite: () => void;
  badge: string;
}): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f4] text-[#202923]">
      <div className="section-wrap flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={onExitPublicSite}
            className="group mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#68756d] transition-colors hover:text-[#202923]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to public site
          </button>

          <div className="rounded-2xl border-[#e1e7e0] bg-white p-6 shadow-xs sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#163d32] text-white">
                <Trees className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display text-lg font-bold leading-none">
                  Swatch<span className="text-[#248a61]">Net</span>
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#68756d]">
                  {badge}
                </span>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }): React.JSX.Element {
  return (
    <div role="alert" className="mt-5 flex items-start justify-between gap-3 rounded-xl border-[#f3b6b6] bg-[#fcf0f0] p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c94c4c]" aria-hidden="true" />
        <span className="text-xs text-[#9a3434]">{message}</span>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-[#9a3434] hover:opacity-70">
          ✕
        </button>
      )}
    </div>
  );
}

function AuthFooterNote(): React.JSX.Element {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-xl border-[#e1e7e0] bg-[#f7f8f4] p-3 text-[11px] leading-relaxed text-[#68756d]">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#248a61]" aria-hidden="true" />
      <span>
        Authentication is handled by Neon Auth. SwatchNet never sees your Google password, and every
        API request is verified server-side before your role or data is released.
      </span>
    </div>
  );
}
